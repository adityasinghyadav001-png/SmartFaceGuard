"""
Confidence Calibration Module.
Applies Platt scaling / temperature scaling to raw CNN probabilities and estimates confidence levels.
"""

import numpy as np

class ConfidenceCalibrator:
    def __init__(self, A: float = 7.0, B: float = -3.5):
        """
        Platt Scaling parameterization:
        p_calibrated = 1 / (1 + exp(-(A * p_raw + B)))
        Tuned to map:
          - Real Human (0.05-0.10) -> 0.05-0.20
          - Borderline (0.15-0.35) -> 0.25-0.50
          - AI (0.75+) -> 0.75-0.98
        """
        self.A = A
        self.B = B

    def calibrate(self, raw_prob: float) -> float:
        """
        Calibrate raw probability based only on the CNN output.
        """
        raw_prob = float(np.clip(raw_prob, 0.0, 1.0))
        
        # Sigmoid Platt scaling
        z = self.A * raw_prob + self.B
        calibrated = 1.0 / (1.0 + np.exp(-z))
        
        return round(float(np.clip(calibrated, 0.0, 1.0)), 4)

    def estimate_confidence(self, calibrated_prob: float) -> float:
        """
        Estimate confidence of prediction.
        Confidence is highest near 0.0 (sure it's real) or 1.0 (sure it's fake)
        and lowest near 0.5 (undecided).
        """
        # Distance from boundary 0.5 mapped to [0.0, 1.0]
        confidence = 2.0 * abs(calibrated_prob - 0.5)
        return round(float(np.clip(confidence, 0.0, 1.0)), 4)
