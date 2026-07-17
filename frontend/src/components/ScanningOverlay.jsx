import React from 'react'

const STAGES = [
  "Detecting facial biometrics",
  "Checking interactive liveness",
  "Running deepfake neural analysis",
  "Calculating authenticity index"
]

function getStageIndex(data, customChallenge) {
  if (!data.face_detected) return 0

  const { blink, turn_left, turn_right } = data.challenge_completed || {}
  const livenessDone = blink && turn_left && turn_right

  if (!livenessDone) return 1

  if (customChallenge === 'processing') return 2

  if (data.verification_complete || customChallenge === 'completed') return 3

  return 3
}

export default function ScanningOverlay({ data, customChallenge }) {
  const isLivenessComplete = data.verification_complete || customChallenge === 'completed'
  if (isLivenessComplete && customChallenge !== 'processing') return null

  const stageIndex = getStageIndex(data, customChallenge)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      
      {/* Small top header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Analysis Pipeline
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          Step {stageIndex + 1} of 4
        </span>
      </div>

      {/* Checklist Grid */}
      <div className="flex flex-col gap-3.5">
        {STAGES.map((label, i) => {
          const status =
            i < stageIndex ? "done" :
            i === stageIndex ? "active" : "pending"

          return (
            <div key={label} className="flex items-center gap-3.5">
              {/* Left Indicator icon */}
              <div className="w-5 h-5 flex items-center justify-center">
                {status === "done" && (
                  <span className="text-emerald-400 font-extrabold text-[10px] bg-emerald-950/40 border border-emerald-500/20 rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                    ✓
                  </span>
                )}
                {status === "active" && (
                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {status === "pending" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-800 inline-block" />
                )}
              </div>

              {/* Text Label */}
              <div className="flex-1">
                <span
                  className={`text-xs font-bold tracking-wide transition-all ${
                    status === "done" ? "text-slate-500 line-through decoration-slate-800" :
                    status === "active" ? "text-white font-extrabold" : "text-slate-600 font-semibold"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Status Pill on the Right */}
              <div>
                {status === "done" && (
                  <span className="text-[8px] tracking-widest font-extrabold px-1.5 py-0.5 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-500/20">
                    OK
                  </span>
                )}
                {status === "active" && (
                  <span className="text-[8px] tracking-widest font-extrabold px-1.5 py-0.5 rounded bg-blue-950/20 text-blue-400 border border-blue-500/20 animate-pulse">
                    Running
                  </span>
                )}
                {status === "pending" && (
                  <span className="text-[8px] tracking-widest font-extrabold px-1.5 py-0.5 rounded bg-slate-950 text-slate-600 border border-slate-900/60">
                    Wait
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
