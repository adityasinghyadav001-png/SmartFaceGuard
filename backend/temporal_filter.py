"""
Temporal Filtering Module.
Smooths predictions over time using a hybrid Median Filter + Exponential Moving Average (EMA)
to eliminate isolated noise spikes and ensure high temporal stability over a 30-frame window.
"""

import numpy as np

class TemporalFilter:
    def __init__(self, alpha: float = 0.15, window_size: int = 30):
        """
        :param alpha: Smoothing factor in range (0.0, 1.0]. Lower values mean more smoothing (slower reaction).
        :param window_size: Size of the history buffer for median filtering.
        """
        self.alpha = alpha
        self.window_size = window_size
        self.history = []
        self.running_value = None

    def update(self, current_val: float) -> float:
        """Update the filter with a new observation, apply median filter, then EMA, and return the smoothed value."""
        self.history.append(current_val)
        if len(self.history) > self.window_size:
            self.history.pop(0)

        # 1. Median filter to ignore isolated spikes
        median_val = float(np.median(self.history))

        # 2. EMA smoothing on top of the median
        if self.running_value is None:
            self.running_value = median_val
        else:
            self.running_value = self.alpha * median_val + (1.0 - self.alpha) * self.running_value

        return round(float(self.running_value), 4)

    def reset(self):
        """Reset the filter state."""
        self.history = []
        self.running_value = None
