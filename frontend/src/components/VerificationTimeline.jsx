import React from 'react'
import { motion } from 'framer-motion'

export default function VerificationTimeline({ data, customChallenge, activePipelineStage }) {
  const completed = data.challenge_completed || {}
  
  // Decide results based on backend data
  const isVerified = data.verification_status === "VERIFIED" || (data.authenticity_score >= 70 && data.risk_level === "LOW")
  const deepfakePassed = data.risk_level === "LOW"
  const replayPassed = !data.replay_detected

  const getStepStatus = (stepKey) => {
    switch (stepKey) {
      case 'face_detected':
        return data.face_detected ? 'completed' : 'active'
      case 'face_aligned':
        return data.face_detected ? 'completed' : 'pending'
      case 'blink':
        if (completed.blink) return 'completed'
        if (customChallenge === 'blink' && data.face_detected) return 'active'
        return 'pending'
      case 'left_turn':
        if (completed.turn_left) return 'completed'
        if (customChallenge === 'turn_left') return 'active'
        return 'pending'
      case 'right_turn':
        if (completed.turn_right) return 'completed'
        if (customChallenge === 'turn_right') return 'active'
        return 'pending'
      case 'replay':
        if (activePipelineStage === 'replay_detection') return 'active'
        if (customChallenge === 'completed' || activePipelineStage === 'deepfake_detection' || activePipelineStage === 'decision_fusion' || activePipelineStage === 'result') {
          return replayPassed ? 'completed' : 'failed'
        }
        return 'pending'
      case 'deepfake':
        if (activePipelineStage === 'deepfake_detection') return 'active'
        if (customChallenge === 'completed' || activePipelineStage === 'decision_fusion' || activePipelineStage === 'result') {
          return deepfakePassed ? 'completed' : 'failed'
        }
        return 'pending'
      case 'fusion':
        if (activePipelineStage === 'decision_fusion') return 'active'
        if (customChallenge === 'completed' || activePipelineStage === 'result') return 'completed'
        return 'pending'
      case 'completed':
        if (activePipelineStage === 'result') {
          return isVerified ? 'completed' : 'failed'
        }
        return 'pending'
      default:
        return 'pending'
    }
  }

  const items = [
    { key: 'face_detected', label: "Face Detected" },
    { key: 'face_aligned', label: "Face Aligned" },
    { key: 'blink', label: "Blink Passed" },
    { key: 'left_turn', label: "Head Left Passed" },
    { key: 'right_turn', label: "Head Right Passed" },
    { key: 'replay', label: "Replay Analysis" },
    { key: 'deepfake', label: "Deepfake Analysis" },
    { key: 'fusion', label: "Decision Engine" },
    { key: 'completed', label: "Verification Completed" },
  ]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      <div className="flex items-center gap-2 mb-5 border-b border-slate-800 pb-3">
        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Live Verification Timeline Audit
        </span>
      </div>

      <div className="relative flex flex-col gap-4 pl-5 border-l border-slate-800">
        {items.map((item, i) => {
          const status = getStepStatus(item.key)

          return (
            <motion.div
              key={item.key}
              className="relative flex items-center justify-between"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <div className="flex items-center gap-3">
                {/* Timeline node circle */}
                <span
                  className={`absolute -left-[29px] flex items-center justify-center h-4.5 w-4.5 rounded-full text-[8px] font-extrabold shadow-sm transition-all duration-300 ${
                    status === 'completed'
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                      : status === 'failed'
                      ? "bg-rose-950 text-rose-400 border border-rose-500/40"
                      : status === 'active'
                      ? "bg-blue-950 text-blue-400 border border-blue-500 animate-pulse"
                      : "bg-slate-950 text-slate-600 border border-slate-800/40"
                  }`}
                >
                  {status === 'completed' && "✓"}
                  {status === 'failed' && "✗"}
                  {status === 'active' && "●"}
                  {status === 'pending' && ""}
                </span>

                {/* Timeline label text */}
                <span
                  className={`text-xs font-bold transition-all duration-300 ${
                    status === 'completed' ? "text-slate-200" :
                    status === 'failed' ? "text-rose-400" :
                    status === 'active' ? "text-blue-400 animate-pulse font-black" :
                    "text-slate-600 font-semibold"
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {/* Status pill tag on right */}
              {status === 'active' && (
                <span className="text-[8px] tracking-widest font-extrabold text-blue-400 uppercase bg-blue-950/40 border border-blue-500/20 px-1.5 py-0.5 rounded animate-pulse">
                  Active
                </span>
              )}
              {status === 'completed' && (
                <span className="text-[8px] tracking-widest font-extrabold text-emerald-400 uppercase bg-emerald-950/20 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  Passed
                </span>
              )}
              {status === 'failed' && (
                <span className="text-[8px] tracking-widest font-extrabold text-rose-400 uppercase bg-rose-950/20 border border-rose-500/20 px-1.5 py-0.5 rounded">
                  Failed
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
