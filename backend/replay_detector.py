"""
Replay Spoof Detector.
Detects physical screen replays (phone, monitor, laptop) and virtual cameras (OBS).
"""

import cv2
import numpy as np

def detect_replay(face_crop: np.ndarray) -> dict:
    """
    Run heuristics to detect screen replay spoofing or virtual cameras.
    Returns:
        {
            "replay_detected": bool,
            "replay_score": float,
            "reason": str
        }
    """
    if face_crop is None or face_crop.size == 0:
        return {"replay_detected": False, "replay_score": 0.0, "reason": "No face crop available"}

    h, w, _ = face_crop.shape
    gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
    
    # ---------------------------------------------------------
    # Heuristic 1: Moire Pattern / FFT High-Frequency Analysis
    # Screens recorded by cameras exhibit periodic high-frequency patterns
    # ---------------------------------------------------------
    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)
    magnitude = np.abs(fshift)
    
    cy, cx = h // 2, w // 2
    # Define a small central low-frequency region
    r = min(h, w) // 10
    if r < 1:
        r = 1
    
    # Mask out center (low frequencies)
    low_freq_mask = np.zeros_like(magnitude)
    cv2.circle(low_freq_mask, (cx, cy), r, 1, -1)
    
    low_freq_sum = np.sum(magnitude * low_freq_mask)
    high_freq_sum = np.sum(magnitude * (1 - low_freq_mask))
    
    # Compute high-to-low frequency ratio
    freq_ratio = float(high_freq_sum / (low_freq_sum + 1e-6))
    
    # ---------------------------------------------------------
    # Heuristic 2: HSV Color Distribution & Saturation Compression
    # Screens re-recording skin colors show narrow, high-saturation profiles
    # ---------------------------------------------------------
    hsv = cv2.cvtColor(face_crop, cv2.COLOR_BGR2HSV)
    h_channel, s_channel, v_channel = cv2.split(hsv)
    
    # Std dev of Saturation channel
    sat_std = float(np.std(s_channel))
    # Screens often compress saturation colors, leading to lower variance. Reduced sensitivity target.
    sat_score = 1.0 - min(sat_std / 12.0, 1.0) if sat_std < 12.0 else 0.0
    
    # ---------------------------------------------------------
    # Heuristic 3: Noise Level / OBS Virtual Camera detection
    # Virtual feeds (e.g. OBS playing a file) lack physical sensor noise.
    # We estimate residual noise using a Laplacian kernel.
    # ---------------------------------------------------------
    noise_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    # Perfectly clean digital streams have extremely low high-frequency noise variance
    # whereas normal webcams have sensor grain
    noise_score = 0.0
    if noise_var < 1.8:
        # Extremely clean digital feed (potentially OBS/Virtual Camera)
        noise_score = 1.0 - (noise_var / 1.8)

    # ---------------------------------------------------------
    # Heuristic 4: Specular Glare (Flat Screen Reflections)
    # Screens reflect light flatly compared to 3D facial contours.
    # Reduced sensitivity by raising divisor threshold.
    # ---------------------------------------------------------
    glare_mask = (v_channel > 240) & (s_channel < 30)
    glare_ratio = float(np.mean(glare_mask))
    glare_score = min(glare_ratio / 0.35, 1.0) # Flag if flat glare exceeds 35% of crop

    # ---------------------------------------------------------
    # Decision Fusion for Replay
    # ---------------------------------------------------------
    # Moire/FFT weight (0.35), Saturation compression (0.25), Virtual noise (0.25), Specular glare (0.15)
    
    # Normalize FFT score with reduced sensitivity
    fft_score = float(np.clip((freq_ratio - 0.40) / 0.45, 0.0, 1.0))
    
    # 2-heuristic agreement validation
    flags = [
        fft_score > 0.5,
        sat_score > 0.5,
        noise_score > 0.5,
        glare_score > 0.5
    ]
    num_flags = sum(flags)
    replay_detected = num_flags >= 2

    raw_replay_score = (
        0.35 * fft_score +
        0.25 * sat_score +
        0.25 * noise_score +
        0.15 * glare_score
    )
    
    # Map score bounds:
    # HIGH (OBS Virtual Camera): 0.80-0.98 (3+ flags)
    # MEDIUM (Phone Replay): 0.60-0.74 (2 flags)
    # LOW (Normal Webcam): 0.05-0.20 (0-1 flags)
    if num_flags >= 3:
        replay_score = float(np.clip(0.80 + (raw_replay_score - 0.5) * 0.3, 0.80, 0.98))
    elif num_flags == 2:
        replay_score = float(np.clip(0.60 + (raw_replay_score - 0.25) * 0.3, 0.60, 0.74))
    else:
        # Capped strictly within low webcam range: 0.05 - 0.20
        replay_score = float(np.clip(raw_replay_score * 0.4, 0.05, 0.20))
        
    replay_score = round(replay_score, 4)
    
    reasons = []
    if fft_score > 0.5:
        reasons.append("High-frequency Moire patterns (screen grid)")
    if sat_score > 0.5:
        reasons.append("Compressed color/saturation distribution")
    if noise_score > 0.5:
        reasons.append("Ultra-clean digital signal (OBS / Virtual Camera)")
    if glare_score > 0.5:
        reasons.append("Flat specular reflections detected")
        
    reason_str = ", ".join(reasons) if reasons else "No anomalous screen features detected"
    if replay_detected and not reasons:
        reason_str = "Aggregated anomaly scores exceed liveness parameters"

    return {
        "replay_detected": replay_detected,
        "replay_score": replay_score,
        "reason": reason_str
    }
