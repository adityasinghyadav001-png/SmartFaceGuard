"""
Deepfake Detection Module.

Real pretrained model: prithivMLmods/Deep-Fake-Detector-v2-Model
(ViT-based binary classifier: Real vs Fake). CPU-friendly.

Falls back to a heuristic placeholder if the model fails to load
(e.g., no internet on first run), keeping the API contract stable.
"""

import cv2
import numpy as np
from PIL import Image
from image_preprocessing import enhance_image
from confidence_calibrator import ConfidenceCalibrator

ANALYSIS_SIZE = (224, 224)  # ViT input size

class BaseDeepfakeModel:
    def predict(self, face_crop: np.ndarray) -> float:
        """Return deepfake probability in range [0.0, 1.0]."""
        raise NotImplementedError

class PretrainedDeepfakeModel(BaseDeepfakeModel):
    """ViT-based deepfake classifier via HuggingFace transformers pipeline."""

    def __init__(self):
        from transformers import pipeline
        self.pipe = pipeline(
            "image-classification",
            model="prithivMLmods/Deep-Fake-Detector-v2-Model",
            device=-1  # CPU
        )

    def predict(self, face_crop: np.ndarray) -> float:
        if face_crop is None or face_crop.size == 0:
            return 0.0

        # Enhance image prior to model evaluation
        enhanced = enhance_image(face_crop)
        rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(rgb, ANALYSIS_SIZE, interpolation=cv2.INTER_AREA)
        pil_img = Image.fromarray(resized)

        results = self.pipe(pil_img)

        print("\n========== MODEL OUTPUT ==========")
        print(results)
        print("==================================\n")

        fake_score = 0.0
        for r in results:
            label = r["label"].lower()
            if "fake" in label:
                fake_score = r["score"]
                break
        else:
            for r in results:
                if "real" in r["label"].lower():
                    fake_score = 1.0 - r["score"]
                    break

        return round(float(np.clip(fake_score, 0.0, 1.0)), 4)

class PlaceholderDeepfakeModel(BaseDeepfakeModel):
    """Heuristic fallback — used only if pretrained model fails to load."""

    def predict(self, face_crop: np.ndarray) -> float:
        if face_crop is None or face_crop.size == 0:
            return 0.0

        # Run mock frequency analysis
        resized = cv2.resize(face_crop, (160, 160), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        blur_score = 1.0 - min(lap_var / 1000.0, 1.0)

        f = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        magnitude = np.abs(fshift)
        h, w = magnitude.shape
        cy, cx = h // 2, w // 2
        center = magnitude[cy - 10:cy + 10, cx - 10:cx + 10]
        high_freq_energy = (magnitude.sum() - center.sum()) / (magnitude.sum() + 1e-6)
        freq_score = 1.0 - min(high_freq_energy * 2.0, 1.0)

        raw_score = 0.5 * blur_score + 0.5 * freq_score
        return round(float(np.clip(raw_score, 0.0, 1.0)), 4)

def get_model() -> BaseDeepfakeModel:
    try:
        return PretrainedDeepfakeModel()
    except Exception as e:
        print(f"[deepfake_service] Pretrained model unavailable, using placeholder: {e}")
        return PlaceholderDeepfakeModel()

_model = None
_calibrator = ConfidenceCalibrator()

def _get_model_lazy() -> BaseDeepfakeModel:
    global _model
    if _model is None:
        _model = get_model()
    return _model

def classify_risk(probability: float) -> str:
    if probability < 0.35:
        return "LOW"
    elif probability < 0.65:
        return "MEDIUM"
    else:
        return "HIGH"

def detect_deepfake(frame: np.ndarray, replay_score: float = 0.0) -> dict:
    """
    Run deepfake detection on a frame (or face crop).
    Returns dict matching the API contract:
    {
        "raw_probability": float,
        "deepfake_probability": float,  # calibrated for backwards-compatibility
        "calibrated_probability": float,
        "confidence": float,
        "risk_level": str
    }
    """
    model = _get_model_lazy()
    raw_prob = model.predict(frame)
    calibrated_prob = _calibrator.calibrate(raw_prob)
    confidence = _calibrator.estimate_confidence(calibrated_prob)
    
    return {
        "raw_probability": raw_prob,
        "deepfake_probability": calibrated_prob,
        "calibrated_probability": calibrated_prob,
        "confidence": confidence,
        "risk_level": classify_risk(calibrated_prob)
    }
