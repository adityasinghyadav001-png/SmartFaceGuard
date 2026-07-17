"""
Decision Fusion Engine Module.
Unifies liveness checks, deepfake probabilities, replay detection, and quality scores
to form a singular, consistent verification status, cap authenticity score, and generate explainable reasons.
"""

def fuse_decision(
    state: dict,
    liveness_score: int,
    calibrated_df_prob: float,
    replay_detected: bool,
    replay_score: float,
    quality_score: float
) -> tuple:
    """
    Fuses all metrics and returns: (verification_status, verification_reason, authenticity_score)
    Possible statuses: PENDING, VERIFIED, FAILED, SUSPICIOUS, REJECTED
    """
    
    # 1. Check if liveness challenges are still in progress
    if not state.get("verification_complete", False):
        verification_status = "PENDING"
        verification_reason = (
            "Verification in progress. Please complete the liveness challenges: "
            "Blink, Turn Left, Turn Right."
        )
        # Smooth authenticity score based on challenge completion
        return verification_status, verification_reason, liveness_score

    # Check for Multiple Subjects Spoof Condition
    if state.get("multiple_faces_detected", False):
        verification_status = "SUSPICIOUS"
        final_authenticity_score = 65  # Suspicious range: 50-80
        verification_reason = (
            "Verification Suspicious.\n"
            "Multiple human subjects detected in frame. Only one subject is permitted."
        )
        return verification_status, verification_reason, final_authenticity_score

    # 2. Liveness is complete. Calculate combined weighted safety score:
    # Deepfake Safety (60%), Replay (10%), Liveness (20%), Quality (10%)
    df_safety = 1.0 - calibrated_df_prob
    rp_safety = 1.0 - replay_score
    lv_safety = liveness_score / 100.0
    qy_safety = quality_score / 100.0

    combined_score = int(round(
        (0.60 * df_safety + 0.10 * rp_safety + 0.20 * lv_safety + 0.10 * qy_safety) * 100.0
    ))

    # Reject only if: Deepfake >= 0.80 OR Replay >= 0.80 OR (Deepfake >= 0.65 AND Replay >= 0.65)
    is_rejected = (
        (calibrated_df_prob >= 0.80) or
        (replay_score >= 0.80) or
        (calibrated_df_prob >= 0.65 and replay_score >= 0.65)
    )

    if is_rejected:
        verification_status = "REJECTED"
        # Map combined score to rejected range (5-35) or (0-25)
        # We can map it to 5-35 range
        final_authenticity_score = int(round((combined_score / 100.0) * 30.0)) + 5
        final_authenticity_score = max(5, min(35, final_authenticity_score))
        
        reasons = []
        if calibrated_df_prob >= 0.65:
            reasons.append(f"Deepfake risk is high (p = {calibrated_df_prob:.2f})")
        if replay_score >= 0.65:
            reasons.append(f"Screen spoof/replay pattern detected (score = {replay_score:.2f})")
            
        verification_reason = (
            f"Identity Rejected.\n"
            f"Security checks failed: {', '.join(reasons)}.\n"
            f"Trust Score: {final_authenticity_score}%"
        )
        
    elif liveness_score < 70:
        # Failed range: 40-59 (or lower if liveness was lower)
        verification_status = "FAILED"
        final_authenticity_score = int(round(40.0 + (liveness_score / 70.0) * 19.0))
        final_authenticity_score = max(10, min(59, final_authenticity_score))
        verification_reason = (
            f"Identity Verification Failed.\n"
            f"Liveness challenge fell below minimum requirements.\n"
            f"- Liveness Score: {liveness_score}%\n"
            f"- Deepfake prob: {calibrated_df_prob:.2f}\n"
            f"- Spoof/Replay score: {replay_score:.2f}"
        )
        
    else:
        # Evaluate combined score for VERIFIED vs SUSPICIOUS vs FAILED
        # Verified >= 80
        # Suspicious 60-79
        # Failed 40-59
        if combined_score >= 80:
            verification_status = "VERIFIED"
            
            # Calibration requirement: If Blink, Left, Right passed, Replay Low, Deepfake Low, Quality >80
            # then authenticity MUST automatically converge between 92-99.
            is_perfect_normal = (
                state.get("challenge_done", {}).get("blink", False) and
                state.get("challenge_done", {}).get("turn_left", False) and
                state.get("challenge_done", {}).get("turn_right", False) and
                calibrated_df_prob < 0.20 and
                replay_score < 0.20 and
                quality_score > 80
            )
            
            if is_perfect_normal:
                # Force converge to 92-99
                score_basis = max(80, min(100, combined_score))
                final_authenticity_score = int(round(92.0 + ((score_basis - 80.0) / 20.0) * 7.0))
            else:
                # Map [80, 100] to [80, 91]
                final_authenticity_score = int(round(80.0 + ((combined_score - 80.0) / 20.0) * 11.0))
                
            final_authenticity_score = max(80, min(99, final_authenticity_score))
            
            verification_reason = (
                f"✓ Face Alignment Confirmed\n"
                f"✓ Blink Challenge Passed\n"
                f"✓ Left Turn Challenge Passed\n"
                f"✓ Right Turn Challenge Passed\n"
                f"✓ Deepfake Check Clear (p = {calibrated_df_prob:.2f})\n"
                f"✓ Replay Check Clear (score = {replay_score:.2f})\n"
                f"Overall Trust Score: {final_authenticity_score}%"
            )
        elif combined_score >= 60:
            verification_status = "SUSPICIOUS"
            # Map combined_score to 60-79 range
            final_authenticity_score = int(round(60.0 + ((combined_score - 60.0) / 20.0) * 19.0))
            final_authenticity_score = max(60, min(79, final_authenticity_score))
            verification_reason = (
                f"Verification Suspicious.\n"
                f"Combined confidence check fell below verified threshold.\n"
                f"- Combined Score: {combined_score}%\n"
                f"- Deepfake prob: {calibrated_df_prob:.2f}\n"
                f"- Spoof/Replay score: {replay_score:.2f}\n"
                f"Secondary manual review recommended."
            )
        else:
            verification_status = "FAILED"
            # Map combined_score to 40-59 range
            final_authenticity_score = int(round(40.0 + ((combined_score - 40.0) / 20.0) * 19.0)) if combined_score >= 40 else 40
            final_authenticity_score = max(40, min(59, final_authenticity_score))
            verification_reason = (
                f"Identity Verification Failed.\n"
                f"Authenticity checks fell below suspicious threshold.\n"
                f"- Combined Score: {combined_score}%\n"
                f"- Deepfake prob: {calibrated_df_prob:.2f}\n"
                f"- Spoof/Replay score: {replay_score:.2f}"
            )

    return verification_status, verification_reason, final_authenticity_score
