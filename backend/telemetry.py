"""
Telemetry Module.
Tracks and computes processing latencies, frame throughput, and session durations.
"""

import time

def init_telemetry(state: dict):
    """Initialize telemetry fields in the session state if not present."""
    if "start_time" not in state or state["start_time"] is None:
        state["start_time"] = time.time()
    if "frames_processed" not in state:
        state["frames_processed"] = 0
    if "total_processing_time_ms" not in state:
        state["total_processing_time_ms"] = 0.0
    if "verification_duration" not in state:
        state["verification_duration"] = 0.0
    if "average_frame_latency" not in state:
        state["average_frame_latency"] = 0.0

def update_telemetry(state: dict, frame_start_time: float) -> float:
    """
    Update session telemetry based on current frame execution time.
    Returns: processing_time_ms for the current frame.
    """
    now = time.time()
    processing_time_ms = round((now - frame_start_time) * 1000.0, 2)
    
    init_telemetry(state)
    
    state["frames_processed"] += 1
    state["total_processing_time_ms"] += processing_time_ms
    
    # Calculate duration
    duration = now - state["start_time"]
    if state.get("verification_complete") and state.get("verification_duration", 0.0) > 0.0:
        pass # Keep frozen verification duration
    else:
        state["verification_duration"] = round(duration, 2)
        
    state["average_frame_latency"] = round(state["total_processing_time_ms"] / state["frames_processed"], 2)
    
    return processing_time_ms
