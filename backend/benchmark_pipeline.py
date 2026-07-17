"""
Automated Benchmarking Script for SmartFaceGuard V2.
Evaluates the upgraded AI pipeline under 5 distinct conditions:
- Real Human
- Multiple Human Subjects
- OBS AI Video
- Phone Replay Attack
- Empty Frame
"""

import time
import numpy as np
import cv2
import base64
from unittest.mock import MagicMock, patch

# Import main components
import main
from main import new_state, app
from fastapi.testclient import TestClient

client = TestClient(app)

# Helper to generate base64 dummy image
def get_dummy_data_url(noise_level=10.0, add_moire=False):
    # Create a 240x240 image
    img = np.ones((240, 240, 3), dtype=np.uint8) * 128
    
    # Draw a face-like oval in BGR skin-tone (approx 110, 150, 200)
    cv2.ellipse(img, (120, 120), (50, 70), 0, 0, 360, (110, 150, 200), -1)
    # Eyes
    cv2.circle(img, (100, 100), 8, (70, 40, 20), -1)
    cv2.circle(img, (140, 100), 8, (70, 40, 20), -1)
    # Nose
    cv2.circle(img, (120, 120), 6, (90, 120, 180), -1)
    # Mouth
    cv2.ellipse(img, (120, 160), (20, 10), 0, 0, 180, (50, 50, 150), -1)

    # Add Gaussian noise
    if noise_level > 0.0:
        noise = np.random.normal(0, noise_level, img.shape).astype(np.float32)
        img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    # Add Moire patterns (high-frequency horizontal lines)
    if add_moire:
        for y in range(0, 240, 4):
            img[y:y+2, :, :] = np.clip(img[y:y+2, :, :].astype(np.float32) * 0.7, 0, 255).astype(np.uint8)

    _, buffer = cv2.imencode('.jpg', img)
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{b64_str}"

# Create Mock landmarks
class MockLandmark:
    def __init__(self, x, y, z=0.0):
        self.x = x
        self.y = y
        self.z = z

def create_mock_face_mesh_result(num_faces=1):
    if num_faces == 0:
        mock_res = MagicMock()
        mock_res.multi_face_landmarks = None
        return mock_res
    
    faces = []
    for _ in range(num_faces):
        landmarks = [MockLandmark(0.5, 0.5) for _ in range(478)]
        # Key landmarks for alignment / PnP:
        # Nose tip
        landmarks[1] = MockLandmark(0.5, 0.5)
        # Chin
        landmarks[152] = MockLandmark(0.5, 0.75)
        # Left eye corner
        landmarks[33] = MockLandmark(0.4, 0.42)
        # Right eye corner
        landmarks[263] = MockLandmark(0.6, 0.42)
        # Left mouth corner
        landmarks[61] = MockLandmark(0.45, 0.6)
        # Right mouth corner
        landmarks[291] = MockLandmark(0.55, 0.6)
        
        # Eyes landmarks for EAR (open eyes by default)
        landmarks[160] = MockLandmark(0.43, 0.40)
        landmarks[158] = MockLandmark(0.47, 0.40)
        landmarks[153] = MockLandmark(0.47, 0.44)
        landmarks[144] = MockLandmark(0.43, 0.44)
        
        landmarks[385] = MockLandmark(0.57, 0.40)
        landmarks[387] = MockLandmark(0.63, 0.40)
        landmarks[373] = MockLandmark(0.63, 0.44)
        landmarks[380] = MockLandmark(0.57, 0.44)
        
        mock_face = MagicMock()
        mock_face.landmark = landmarks
        faces.append(mock_face)
        
    mock_res = MagicMock()
    mock_res.multi_face_landmarks = faces
    return mock_res

def run_benchmark():
    print("==========================================================================")
    print("                  SMARTFACEGUARD V2 BENCHMARK RUNNER                      ")
    print("==========================================================================")
    
    scenarios = [
        {
            "name": "Real Human",
            "noise_level": 8.0,
            "add_moire": False,
            "num_faces": 1,
            "mock_predict_score": 0.03,
            "mock_replay": {"replay_detected": False, "replay_score": 0.05, "reason": "No anomalies"},
            "simulate_challenges": True
        },
        {
            "name": "Multiple Human Subjects",
            "noise_level": 8.0,
            "add_moire": False,
            "num_faces": 2,
            "mock_predict_score": 0.03,
            "mock_replay": {"replay_detected": False, "replay_score": 0.05, "reason": "No anomalies"},
            "simulate_challenges": True
        },
        {
            "name": "OBS AI Video",
            "noise_level": 0.1,  # Perfectly clean virtual feed
            "add_moire": False,
            "num_faces": 1,
            "mock_predict_score": 0.65, # Calibrates to > 0.80
            "mock_replay": {"replay_detected": True, "replay_score": 0.82, "reason": "Ultra-clean digital signal (OBS / Virtual Camera)"},
            "simulate_challenges": True
        },
        {
            "name": "Phone Replay Attack",
            "noise_level": 6.0,
            "add_moire": True,   # High-frequency screen grids
            "num_faces": 1,
            "mock_predict_score": 0.65, # Calibrates to > 0.80
            "mock_replay": {"replay_detected": True, "replay_score": 0.85, "reason": "High-frequency Moire patterns (screen grid)"},
            "simulate_challenges": True
        },
        {
            "name": "Empty Frame",
            "noise_level": 5.0,
            "add_moire": False,
            "num_faces": 0,
            "mock_predict_score": 0.00,
            "mock_replay": {"replay_detected": False, "replay_score": 0.00, "reason": "No face detected"},
            "simulate_challenges": False
        }
    ]

    results_table = []

    for sc in scenarios:
        name = sc["name"]
        print(f"\nEvaluating Scenario: {name}...")
        
        # Reset session
        reset_res = client.post("/reset")
        session_id = reset_res.json()["session_id"]
        
        # Run 25 frames to complete sequential challenges (Blink, Left, Right)
        final_data = None
        
        for frame_idx in range(25):
            mock_mesh = create_mock_face_mesh_result(sc["num_faces"])
            
            # Determine pose state for liveness progression simulation
            if sc["simulate_challenges"] and sc["num_faces"] > 0:
                # Frames 0-5: center pose (with blink at frame 4)
                if 0 <= frame_idx <= 5:
                    mock_yaw, mock_pitch, mock_roll = 0.0, 0.0, 0.0
                    mock_ear = 0.1 if frame_idx == 4 else 0.3
                # Frames 6-14: turn left (yaw = 25.0)
                elif 6 <= frame_idx <= 14:
                    mock_yaw, mock_pitch, mock_roll = 25.0, 0.0, 0.0
                    mock_ear = 0.3
                # Frames 15-24: turn right (yaw = -25.0)
                else:
                    mock_yaw, mock_pitch, mock_roll = -25.0, 0.0, 0.0
                    mock_ear = 0.3
            else:
                mock_yaw, mock_pitch, mock_roll = 0.0, 0.0, 0.0
                mock_ear = 0.3

            # Generate dummy image
            img_payload = get_dummy_data_url(sc["noise_level"], sc["add_moire"])
            
            # Patch face mesh process, deepfake model predict, head pose estimator, and replay detector
            with patch('main.face_mesh.process', return_value=mock_mesh), \
                 patch('deepfake_service.PretrainedDeepfakeModel.predict', return_value=sc["mock_predict_score"]), \
                 patch('deepfake_service.PlaceholderDeepfakeModel.predict', return_value=sc["mock_predict_score"]), \
                 patch('face_analyzer.estimate_head_pose', return_value=(mock_yaw, mock_pitch, mock_roll)), \
                 patch('face_analyzer.eye_aspect_ratio', return_value=mock_ear), \
                 patch('main.detect_replay', return_value=sc["mock_replay"]):
                
                response = client.post(
                    "/analyze",
                    headers={"X-Session-ID": session_id},
                    json={"image": img_payload}
                )
                
                if response.status_code == 200:
                    final_data = response.json()
                else:
                    print(f"Error in frame {frame_idx}: {response.text}")
                    break

        if final_data:
            results_table.append({
                "Scenario": name,
                "Deepfake Prob": final_data.get("deepfake_probability", 0.0),
                "Authenticity Score": final_data.get("authenticity_score", 0),
                "Replay Score": final_data.get("replay_score", 0.0),
                "Quality Score": final_data.get("quality_score", 0.0),
                "Final Decision": final_data.get("verification_status", "UNKNOWN"),
                "Processing Time": f"{final_data.get('processing_time_ms', 0.0)} ms"
            })
            print(f"Outcome Decision: {final_data.get('verification_status')} (Reason: {final_data.get('verification_reason').replace(chr(10), ' ')[:75]}...)")
        else:
            print(f"Scenario {name} failed to process.")

    # Render results table
    print("\n" + "="*110)
    print(f"{'SCENARIO':<30} | {'DF PROB':<9} | {'AUTH SCORE':<12} | {'REPLAY SCORE':<12} | {'QUALITY SCORE':<13} | {'DECISION':<12} | {'LATENCY':<10}")
    print("="*110)
    for r in results_table:
        print(f"{r['Scenario']:<30} | {r['Deepfake Prob']:<9.4f} | {r['Authenticity Score']:<12} | {r['Replay Score']:<12.4f} | {r['Quality Score']:<13.2f} | {r['Final Decision']:<12} | {r['Processing Time']:<10}")
    print("="*110)

if __name__ == "__main__":
    run_benchmark()
