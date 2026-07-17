import cv2
import numpy as np
import base64
import uuid
import time
import os
from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Pipeline Imports
from face_analyzer import analyze_frame, face_mesh, lock, align_face_geometry
from deepfake_service import detect_deepfake, _get_model_lazy, classify_risk
from image_quality import assess_quality
from replay_detector import detect_replay
from temporal_filter import TemporalFilter
from telemetry import init_telemetry, update_telemetry
from decision_engine import fuse_decision

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def new_state():
    return {
        "blink_count": 0,
        "eye_closed": False,
        "head_turns": [],
        "face_frame_count": 0,
        "challenge_index": 0,
        "challenge_steps": ["blink", "turn_left", "turn_right"],
        "challenge_done": {"blink": False, "turn_left": False, "turn_right": False},
        "verification_complete": False,
        "blink_count_start": None,
        # Temporal Smoothers
        "deepfake_filter": TemporalFilter(alpha=0.15),
        "replay_filter": TemporalFilter(alpha=0.15),
        # Makers Conclave Stabilization Fields:
        "start_time": None,
        "frames_processed": 0,
        "total_processing_time_ms": 0.0,
        "deepfake_predictions": [],
        "best_frame_score": -1.0,
        "captured_frame": None,
        "verification_status": "PENDING",
        "verification_reason": "Verification in progress. Please complete liveness challenges: Blink, Turn Left, Turn Right.",
        "verification_duration": 0.0,
        "final_response": None
    }

# session_id -> state dict.
sessions: dict[str, dict] = {}

def get_session(session_id):
    if not session_id or session_id not in sessions:
        session_id = str(uuid.uuid4())
        sessions[session_id] = new_state()
    return session_id, sessions[session_id]

class FramePayload(BaseModel):
    image: str

@app.on_event("startup")
def load_models():
    # Pre-load deepfake model at startup
    _get_model_lazy()

@app.post("/analyze")
def analyze(payload: FramePayload, x_session_id: str = Header(default=None)):
    start_time = time.time()
    if not payload.image or "," not in payload.image:
        return {"error": "Invalid image payload"}

    session_id, state = get_session(x_session_id)

    # 1. Short-circuit if session is already completed and frozen
    if state.get("verification_complete") and state.get("final_response") is not None:
        return state["final_response"]

    # Initialize telemetry fields
    init_telemetry(state)

    try:
        img_data = base64.b64decode(payload.image.split(",")[-1])
        np_arr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception:
        return {"error": "Failed to decode image"}

    if frame is None:
        return {"error": "Failed to decode image"}

    h, w, _ = frame.shape

    # 2. Run initial Face Mesh to retrieve landmarks for alignment
    with lock:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)

    aligned_frame = frame.copy()
    face_crop = None
    face_box = None
    
    state["multiple_faces_detected"] = False
    
    # 3. Apply horizontal face alignment based on eye centers if face detected
    if results.multi_face_landmarks:
        state["multiple_faces_detected"] = len(results.multi_face_landmarks) > 1
        lm = results.multi_face_landmarks[0].landmark
        aligned_frame, M = align_face_geometry(frame, lm, w, h)
        
        # Re-run face mesh on aligned image for perfectly upright landmarks
        aligned_rgb = cv2.cvtColor(aligned_frame, cv2.COLOR_BGR2RGB)
        with lock:
            results = face_mesh.process(aligned_rgb)

    # 4. Extract cropped face area from the aligned frame
    if results.multi_face_landmarks:
        lm = results.multi_face_landmarks[0].landmark
        xs = [l.x * w for l in lm]
        ys = [l.y * h for l in lm]
        xmin, xmax = int(min(xs)), int(max(xs))
        ymin, ymax = int(min(ys)), int(max(ys))
        
        pad_w = int((xmax - xmin) * 0.15)
        pad_h = int((ymax - ymin) * 0.15)
        
        xmin = max(0, xmin - pad_w)
        xmax = min(w, xmax + pad_w)
        ymin = max(0, ymin - pad_h)
        ymax = min(h, ymax + pad_h)
        
        face_crop = aligned_frame[ymin:ymax, xmin:xmax]
        face_box = (xmin, ymin, xmax, ymax)

    # 5. Assess Image Quality metrics
    if face_crop is not None and face_crop.size > 0:
        quality_metrics = assess_quality(face_crop, frame.shape, face_box)
    else:
        quality_metrics = assess_quality(None)

    # 6. Assess Replay Attack / Spoofing heuristics
    if face_crop is not None and face_crop.size > 0:
        replay_result = detect_replay(face_crop)
    else:
        replay_result = {"replay_detected": False, "replay_score": 0.0, "reason": "No face detected"}

    # Apply temporal filter to replay score
    smoothed_replay_score = state["replay_filter"].update(replay_result["replay_score"])
    replay_detected = replay_result["replay_detected"]

    # 7. Deepfake CNN classification
    if face_crop is not None and face_crop.size > 0:
        deepfake_result = detect_deepfake(face_crop, replay_score=smoothed_replay_score)
    else:
        deepfake_result = {
            "raw_probability": 0.0,
            "deepfake_probability": 0.0,
            "calibrated_probability": 0.0,
            "confidence": 0.0,
            "risk_level": "LOW"
        }

    # Apply temporal filter to deepfake risk
    smoothed_df_prob = state["deepfake_filter"].update(deepfake_result["calibrated_probability"])
    state["deepfake_predictions"].append(smoothed_df_prob)

    # Track best snapshot (centering_score * sharpness)
    if face_crop is not None and face_crop.size > 0:
        frame_score = quality_metrics["sharpness"] * quality_metrics["centering_score"]
        if frame_score > state.get("best_frame_score", -1.0):
            state["best_frame_score"] = frame_score
            state["captured_frame"] = payload.image

    # 8. Liveness and challenge progression
    result = analyze_frame(aligned_frame, state, deepfake_probability=smoothed_df_prob, results=results)

    # 9. Enterprise Decision Fusion
    verification_status, verification_reason, final_authenticity_score = fuse_decision(
        state=state,
        liveness_score=result["authenticity_score"],
        calibrated_df_prob=smoothed_df_prob,
        replay_detected=replay_detected,
        replay_score=smoothed_replay_score,
        quality_score=quality_metrics["quality_score"]
    )

    # Set default best snapshot fallback if somehow empty at completion
    if state["verification_complete"] and state.get("captured_frame") is None:
        state["captured_frame"] = payload.image

    # 10. Update Telemetry
    processing_time_ms = update_telemetry(state, start_time)

    # Compile the complete response
    response_dict = {
        "face_detected": result["face_detected"],
        "blink_count": result["blink_count"],
        "head_turn": result["head_turn"],
        "authenticity_score": final_authenticity_score,
        "confidence_level": result["confidence_level"],
        "current_challenge": state["challenge_steps"][state["challenge_index"]] if state["challenge_index"] < len(state["challenge_steps"]) else None,
        "challenge_completed": state["challenge_done"],
        "verification_complete": state["verification_complete"],
        "deepfake_probability": round(smoothed_df_prob, 4),
        "risk_level": classify_risk(smoothed_df_prob),
        "session_id": session_id,
        "verification_status": verification_status,
        "verification_reason": verification_reason,
        "processing_time_ms": processing_time_ms,
        "verification_duration": state["verification_duration"],
        "captured_frame": state.get("captured_frame"),
        "frames_processed": state["frames_processed"],
        "average_frame_latency": state["average_frame_latency"],
        
        # Enhanced Telemetry payload
        "brightness": quality_metrics["brightness"],
        "contrast": quality_metrics["contrast"],
        "sharpness": quality_metrics["sharpness"],
        "blur": quality_metrics["blur"],
        "quality_score": quality_metrics["quality_score"],
        "quality_label": quality_metrics["quality_label"],
        "replay_detected": bool(replay_detected),
        "replay_score": round(smoothed_replay_score, 4),
        "yaw": result["yaw"],
        "pitch": result["pitch"],
        "roll": result["roll"],
        "adaptive_threshold": result["adaptive_threshold"]
    }

    if state["verification_complete"]:
        state["final_response"] = response_dict

    return response_dict

@app.post("/deepfake-check")
def deepfake_check(payload: FramePayload):
    if not payload.image or "," not in payload.image:
        return {"error": "Invalid image payload"}

    try:
        img_data = base64.b64decode(payload.image.split(",")[-1])
        np_arr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception:
        return {"error": "Failed to decode image"}

    if frame is None:
        return {"error": "Failed to decode image"}

    # Single check does not have a session or replay context
    return detect_deepfake(frame, replay_score=0.0)

@app.post("/reset")
def reset(x_session_id: str = Header(default=None)):
    session_id, _ = get_session(x_session_id)
    sessions[session_id] = new_state()
    return {"status": "reset", "session_id": session_id}

@app.get("/challenge-status")
def challenge_status(x_session_id: str = Header(default=None)):
    session_id, state = get_session(x_session_id)
    steps = state["challenge_steps"]
    idx = state["challenge_index"]
    current = steps[idx] if idx < len(steps) else None
    return {
        "current_challenge": current,
        "completed": state["challenge_done"],
        "verification_complete": state["verification_complete"],
        "session_id": session_id
    }



@app.get("/")
def root():
    return {"status": "SmartFaceGuard backend running"}
