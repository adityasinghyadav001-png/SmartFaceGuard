"""
Image Quality Assessment Module.
Calculates exposure, noise, brightness, contrast, sharpness, blur, and centering metrics.
"""

import cv2
import numpy as np

def assess_quality(face_crop: np.ndarray, frame_shape: tuple = None, face_box: tuple = None) -> dict:
    """
    Assess quality parameters of a face crop.
    
    :param face_crop: np.ndarray of shape (H, W, 3) (BGR format)
    :param frame_shape: optional original frame shape (H, W, C)
    :param face_box: optional face bounding box tuple (xmin, ymin, xmax, ymax)
    :return: dict of quality metrics
    """
    if face_crop is None or face_crop.size == 0:
        return {
            "brightness": 0.0,
            "contrast": 0.0,
            "sharpness": 0.0,
            "blur": 1.0,
            "exposure": 0.0,
            "noise": 0.0,
            "face_size_ratio": 0.0,
            "centering_score": 0.0,
            "quality_score": 0.0,
            "quality_label": "POOR"
        }

    # Convert to grayscale for metric calculations
    gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # 1. Brightness (using average luminance)
    brightness = float(np.mean(gray))
    # Normalize brightness: target is 125
    brightness_norm = 1.0 - min(abs(brightness - 125.0) / 125.0, 1.0)

    # 2. Contrast (using standard deviation of pixel intensities)
    contrast = float(np.std(gray))
    # Normalize contrast: standard target is dev >= 45
    contrast_norm = min(contrast / 45.0, 1.0)

    # 3. Sharpness & Blur
    # Laplacian variance is a standard indicator of sharpness
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    # Normalize sharpness: target >= 150
    sharpness_norm = min(sharpness / 150.0, 1.0)
    
    # Blur is inverse of normalized sharpness
    blur = float(np.clip(1.0 - sharpness_norm, 0.0, 1.0))

    # 4. Exposure assessment (percentage of saturated pixels)
    over_exposed = float(np.mean(gray > 240))
    under_exposed = float(np.mean(gray < 15))
    exposure_score = float(np.clip(1.0 - (over_exposed + under_exposed), 0.0, 1.0))

    # 5. Noise Estimation (via Gaussian residuals)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    residuals = np.abs(gray.astype(np.float32) - blurred.astype(np.float32))
    noise = float(np.mean(residuals))
    # Normalize noise: lower noise is better
    noise_norm = float(np.clip(1.0 - (noise / 15.0), 0.0, 1.0))

    # 6. Face Size Ratio
    face_size_ratio = 0.0
    if frame_shape is not None and face_box is not None:
        frame_h, frame_w = frame_shape[0], frame_shape[1]
        xmin, ymin, xmax, ymax = face_box
        face_area = (xmax - xmin) * (ymax - ymin)
        frame_area = frame_h * frame_w
        face_size_ratio = float(face_area / (frame_area + 1e-6))
    
    # Normalize face size: target size is 15% - 40% of frame
    if face_size_ratio < 0.15:
        size_norm = face_size_ratio / 0.15
    elif face_size_ratio > 0.5:
        size_norm = max(0.0, 1.0 - (face_size_ratio - 0.5) * 2)
    else:
        size_norm = 1.0

    # 7. Face Centering
    centering_score = 1.0
    if frame_shape is not None and face_box is not None:
        frame_h, frame_w = frame_shape[0], frame_shape[1]
        xmin, ymin, xmax, ymax = face_box
        face_cx = (xmin + xmax) / 2.0
        face_cy = (ymin + ymax) / 2.0
        frame_cx = frame_w / 2.0
        frame_cy = frame_h / 2.0
        
        dist = np.sqrt((face_cx - frame_cx) ** 2 + (face_cy - frame_cy) ** 2)
        max_dist = np.sqrt(frame_cx ** 2 + frame_cy ** 2)
        centering_score = float(np.clip(1.0 - (dist / (max_dist + 1e-6)), 0.0, 1.0))

    # 8. Overall Quality Score (weighted average of normalized parameters)
    weights = {
        "brightness": 0.15,
        "contrast": 0.15,
        "sharpness": 0.25,
        "exposure": 0.15,
        "noise": 0.10,
        "size": 0.10,
        "centering": 0.10
    }
    
    weighted_sum = (
        weights["brightness"] * brightness_norm +
        weights["contrast"] * contrast_norm +
        weights["sharpness"] * sharpness_norm +
        weights["exposure"] * exposure_score +
        weights["noise"] * noise_norm +
        weights["size"] * size_norm +
        weights["centering"] * centering_score
    )
    
    quality_score = float(np.clip(weighted_sum * 100.0, 0.0, 100.0))

    # Quality Label
    if quality_score >= 80.0:
        quality_label = "EXCELLENT"
    elif quality_score >= 60.0:
        quality_label = "GOOD"
    elif quality_score >= 40.0:
        quality_label = "FAIR"
    else:
        quality_label = "POOR"

    return {
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "blur": round(blur, 2),
        "exposure": round(exposure_score, 2),
        "noise": round(noise, 2),
        "face_size_ratio": round(face_size_ratio, 3),
        "centering_score": round(centering_score, 2),
        "quality_score": round(quality_score, 2),
        "quality_label": quality_label
    }
