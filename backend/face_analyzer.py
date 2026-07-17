import cv2
import numpy as np
import mediapipe as mp
import threading

lock = threading.Lock()
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1, refine_landmarks=True,
    min_detection_confidence=0.5, min_tracking_confidence=0.5
)

LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

# Standard 3D model points of facial landmarks for Pose Estimation
MODEL_POINTS = np.array([
    (0.0, 0.0, 0.0),             # Nose tip (landmark 1)
    (0.0, -330.0, -65.0),        # Chin (landmark 152)
    (-225.0, 170.0, -135.0),     # Left eye left corner (landmark 33)
    (225.0, 170.0, -135.0),      # Right eye right corner (landmark 263)
    (-150.0, -150.0, -125.0),    # Left mouth corner (landmark 61)
    (150.0, -150.0, -125.0)      # Right mouth corner (landmark 291)
], dtype=np.float32)

def eye_aspect_ratio(landmarks, eye_idx, w, h):
    pts = [(landmarks[i].x * w, landmarks[i].y * h) for i in eye_idx]
    A = np.linalg.norm(np.array(pts[1]) - np.array(pts[5]))
    B = np.linalg.norm(np.array(pts[2]) - np.array(pts[4]))
    C = np.linalg.norm(np.array(pts[0]) - np.array(pts[3]))
    return (A + B) / (2.0 * C)

def estimate_head_pose(landmarks, w, h) -> tuple:
    """
    Estimate head pose angles (Yaw, Pitch, Roll) in degrees using cv2.solvePnP.
    """
    image_points = np.array([
        (landmarks[1].x * w, landmarks[1].y * h),       # Nose tip
        (landmarks[152].x * w, landmarks[152].y * h),   # Chin
        (landmarks[33].x * w, landmarks[33].y * h),     # Left eye left corner
        (landmarks[263].x * w, landmarks[263].y * h),   # Right eye right corner
        (landmarks[61].x * w, landmarks[61].y * h),     # Left mouth corner
        (landmarks[291].x * w, landmarks[291].y * h)    # Right mouth corner
    ], dtype=np.float32)

    # Approximate camera matrix parameters
    focal_length = w
    center = (w / 2.0, h / 2.0)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float32)

    dist_coeffs = np.zeros((4, 1))  # Assuming no lens distortion
    
    success, rvec, tvec = cv2.solvePnP(
        MODEL_POINTS, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
    )

    if not success:
        return 0.0, 0.0, 0.0

    rmat, _ = cv2.Rodrigues(rvec)
    
    # Calculate Euler angles from rotation matrix
    sy = np.sqrt(rmat[0, 0] * rmat[0, 0] + rmat[1, 0] * rmat[1, 0])
    singular = sy < 1e-6
    
    if not singular:
        x = np.arctan2(rmat[2, 1], rmat[2, 2]) # Pitch
        y = np.arctan2(-rmat[2, 0], sy)       # Yaw
        z = np.arctan2(rmat[1, 0], rmat[0, 0]) # Roll
    else:
        x = np.arctan2(-rmat[1, 2], rmat[1, 1])
        y = np.arctan2(-rmat[2, 0], sy)
        z = 0.0

    return float(np.degrees(y)), float(np.degrees(x)), float(np.degrees(z))

def align_face_geometry(frame, landmarks, w, h):
    """
    Align face by rotating the frame so that the eyes are aligned horizontally.
    """
    left_eye_x = landmarks[33].x * w
    left_eye_y = landmarks[33].y * h
    right_eye_x = landmarks[263].x * w
    right_eye_y = landmarks[263].y * h

    dy = right_eye_y - left_eye_y
    dx = right_eye_x - left_eye_x
    angle = np.degrees(np.arctan2(dy, dx))

    # Keep alignment threshold within bounds (accept roll up to +-7 degrees)
    if abs(angle) > 7.0:
        eyes_center = ((left_eye_x + right_eye_x) / 2.0, (left_eye_y + right_eye_y) / 2.0)
        M = cv2.getRotationMatrix2D(eyes_center, angle, 1.0)
        aligned_frame = cv2.warpAffine(frame, M, (w, h), flags=cv2.INTER_CUBIC)
        return aligned_frame, M
    return frame, None

def classify_confidence(score: int) -> str:
    if score >= 80:
        return "HIGH"
    elif score >= 50:
        return "MEDIUM"
    else:
        return "LOW"

def analyze_frame(frame, state, deepfake_probability: float = 0.0, results=None):
    h, w, _ = frame.shape
    if results is None:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        with lock:
            results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return {
            "face_detected": False,
            "blink_count": state.get("blink_count", 0),
            "head_turn": "none",
            "authenticity_score": 0,
            "confidence_level": classify_confidence(0),
            "yaw": 0.0,
            "pitch": 0.0,
            "roll": 0.0,
            "adaptive_threshold": 0.21
        }

    lm = results.multi_face_landmarks[0].landmark

    # 1. 3D Head Pose Solver (Yaw, Pitch, Roll)
    yaw, pitch, roll = estimate_head_pose(lm, w, h)

    # Convert pose to simple turn status for display/progression
    # Yaw controls Left/Right rotation. Threshold relaxed to 10 degrees.
    if yaw > 10.0:
        head_turn = "left"
    elif yaw < -10.0:
        head_turn = "right"
    else:
        head_turn = "center"

    state["head_turns"].append(head_turn)
    if len(state["head_turns"]) > 30:
        state["head_turns"].pop(0)

    # 2. Adaptive Eye Aspect Ratio (EAR)
    left_ear = eye_aspect_ratio(lm, LEFT_EYE, w, h)
    right_ear = eye_aspect_ratio(lm, RIGHT_EYE, w, h)
    ear = (left_ear + right_ear) / 2.0

    # Maintain EAR history to dynamically calculate threshold
    if "ear_history" not in state:
        state["ear_history"] = []
    
    # Fill baseline EAR when looking center and eye open
    if head_turn == "center" and len(state["ear_history"]) < 30:
        if ear > 0.22: # Filter out blink frames from initial baseline
            state["ear_history"].append(ear)

    baseline_ear = np.mean(state["ear_history"]) if len(state["ear_history"]) >= 10 else 0.31
    adaptive_threshold = 0.65 * baseline_ear

    # Blink detection with adaptive threshold
    if ear < adaptive_threshold and not state.get("eye_closed", False):
        state["eye_closed"] = True
    elif ear >= adaptive_threshold and state.get("eye_closed", False):
        state["blink_count"] = state.get("blink_count", 0) + 1
        state["eye_closed"] = False

    # 3. Stable Challenge Progression (Requires sequential hold of frames)
    steps = state.get("challenge_steps", ["blink", "turn_left", "turn_right"])
    idx = state.get("challenge_index", 0)
    
    if "challenge_hold_frames" not in state:
        state["challenge_hold_frames"] = 0

    if idx < len(steps):
        current_challenge = steps[idx]

        if current_challenge == "blink":
            if state.get("blink_count_start") is None:
                state["blink_count_start"] = state.get("blink_count", 0)
            if state.get("blink_count", 0) > state["blink_count_start"] and not state["challenge_done"]["blink"]:
                state["challenge_done"]["blink"] = True
                state["challenge_index"] += 1
                state["challenge_hold_frames"] = 0

        elif current_challenge == "turn_left":
            if head_turn == "left":
                state["challenge_hold_frames"] += 1
                if state["challenge_hold_frames"] >= 5 and not state["challenge_done"]["turn_left"]:
                    state["challenge_done"]["turn_left"] = True
                    state["challenge_index"] += 1
                    state["challenge_hold_frames"] = 0
            else:
                state["challenge_hold_frames"] = max(0, state["challenge_hold_frames"] - 1)

        elif current_challenge == "turn_right":
            if head_turn == "right":
                state["challenge_hold_frames"] += 1
                if state["challenge_hold_frames"] >= 5 and not state["challenge_done"]["turn_right"]:
                    state["challenge_done"]["turn_right"] = True
                    state["challenge_index"] += 1
                    state["challenge_hold_frames"] = 0
            else:
                state["challenge_hold_frames"] = max(0, state["challenge_hold_frames"] - 1)

    # Verification only completes when ALL challenges are done
    if (state["challenge_done"]["blink"]
            and state["challenge_done"]["turn_left"]
            and state["challenge_done"]["turn_right"]):
        state["verification_complete"] = True
    else:
        state["verification_complete"] = False

    # --- Authenticity Score (weighted, evidence-based) ---
    
    # 1. Face Presence (30%)
    state["face_frame_count"] = state.get("face_frame_count", 0) + 1
    face_presence_score = min(state["face_frame_count"] / 10.0, 1.0)

    # 2. Blink Validation (25%)
    if state["challenge_done"]["blink"]:
        blink_score = 1.0
    elif state.get("blink_count", 0) > 0:
        blink_score = 0.5
    else:
        blink_score = 0.0

    # 3. Head Movement Validation (25%)
    completed_turns = sum([
        state["challenge_done"]["turn_left"],
        state["challenge_done"]["turn_right"]
    ])
    head_movement_score = completed_turns / 2.0

    # 4. Deepfake Safety (20%)
    deepfake_safety_score = 1.0 - float(np.clip(deepfake_probability, 0.0, 1.0))

    weighted_score = (
        0.30 * face_presence_score +
        0.25 * blink_score +
        0.25 * head_movement_score +
        0.20 * deepfake_safety_score
    )

    score = int(round(weighted_score * 100))
    confidence_level = classify_confidence(score)

    return {
        "face_detected": True,
        "blink_count": state["blink_count"],
        "head_turn": head_turn,
        "authenticity_score": score,
        "confidence_level": confidence_level,
        "yaw": round(yaw, 2),
        "pitch": round(pitch, 2),
        "roll": round(roll, 2),
        "adaptive_threshold": round(adaptive_threshold, 3)
    }
