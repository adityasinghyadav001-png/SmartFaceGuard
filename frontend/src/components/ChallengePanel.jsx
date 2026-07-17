import React from 'react'

const CHALLENGE_LABELS = {
  blink: "Blink Once",
  turn_left: "Turn Your Head Left (Hold 2s)",
  turn_right: "Turn Your Head Right (Hold 2s)",
  processing: "Decision Engine Processing...",
  completed: "Biometric Audit Complete"
}

const CHALLENGE_ORDER = ["blink", "turn_left", "turn_right"]

export default function ChallengePanel({ customChallenge, completed, verificationComplete, holdProgress }) {
  const isLivenessComplete = verificationComplete || customChallenge === 'completed' || customChallenge === 'processing'

  if (isLivenessComplete) {
    const isProcessing = customChallenge === 'processing'
    return (
      <div className={`border rounded-2xl p-5 text-center shadow-lg transition-all duration-500 backdrop-blur-md ${
        isProcessing 
          ? "bg-blue-950/20 border-blue-500/20 text-blue-400" 
          : "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
      }`}>
        <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center font-extrabold text-xl mb-3 ${
          isProcessing ? "bg-blue-950 border border-blue-500 text-blue-400 animate-spin" : "bg-emerald-950 border border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        }`}>
          {isProcessing ? "⟳" : "✓"}
        </div>
        <h3 className={`text-lg font-black tracking-wide ${isProcessing ? "text-blue-400" : "text-emerald-400"}`}>
          {isProcessing ? "Enterprise Decision Fusion" : "Biometric Verification Success"}
        </h3>
        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-semibold">
          {isProcessing ? "Aggregating spatial features, CNN deepfake scores, and replay indicators..." : "Liveness challenges successfully passed. Identity authenticity confirmed."}
        </p>
      </div>
    )
  }

  const safeCompleted = completed || { blink: false, turn_left: false, turn_right: false }
  const percentHold = (holdProgress / 5) * 100

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Required Actions</span>
          <h3 className="text-md font-black text-slate-200 mt-0.5 tracking-wide">Interactive Liveness</h3>
        </div>
        <span className="text-[9px] font-extrabold tracking-widest text-blue-400 bg-blue-950/40 border border-blue-500/20 rounded px-2 py-0.5 animate-pulse uppercase">
          Liveness Active
        </span>
      </div>

      <div className="mb-5">
        <p className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">Active Prompt</p>
        <p className="text-xl font-black text-white tracking-tight">
          {CHALLENGE_LABELS[customChallenge] || "Position Face in Camera"}
        </p>
        
        {/* Stable Hold Progress Indicator */}
        {(customChallenge === 'turn_left' || customChallenge === 'turn_right') && (
          <div className="mt-4 bg-slate-950 border border-slate-800 rounded-lg p-3">
            <div className="flex justify-between text-[9px] font-extrabold uppercase text-slate-400 mb-1.5">
              <span>Stable Hold Duration</span>
              <span className="font-mono text-blue-400">{(holdProgress * 0.4).toFixed(2)}s / 2.0s</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/80">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                style={{ width: `${percentHold}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {CHALLENGE_ORDER.map((key) => {
          const isDone = safeCompleted[key]
          const isActive = customChallenge === key

          return (
            <div
              key={key}
              className={`text-center py-2.5 px-2 rounded-xl border transition-all duration-300 ${
                isDone
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                  : isActive
                  ? "bg-blue-950/30 border-blue-500/30 text-blue-400 font-bold shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                  : "bg-slate-950/50 border-slate-800/40 text-slate-600"
              }`}
            >
              <div className="text-[9px] uppercase font-bold tracking-wider mb-1 truncate">
                {key.replace('_', ' ')}
              </div>
              <div className="text-xs flex items-center justify-center gap-1">
                {isDone ? (
                  <span className="font-extrabold">✓</span>
                ) : isActive ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                ) : (
                  <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Wait</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
