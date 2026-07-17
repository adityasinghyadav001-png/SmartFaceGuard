import React from 'react'

export default function VerificationResultCard({ data, customChallenge }) {
  if (customChallenge !== 'completed') return null

  const { authenticity_score, confidence_level, risk_level, deepfake_probability, session_id } = data

  const statusVal = data.verification_status || (authenticity_score >= 70 && risk_level === "LOW" ? "VERIFIED" : "SUSPICIOUS")
  
  const statusLabel = 
    statusVal === "VERIFIED" ? "Verified" :
    statusVal === "SUSPICIOUS" ? "Suspicious" :
    statusVal === "REJECTED" ? "Rejected" : "Failed"

  const pillColor = 
    statusVal === "VERIFIED" ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/30" :
    statusVal === "SUSPICIOUS" ? "bg-amber-950/30 text-amber-400 border-amber-500/30" :
    "bg-rose-950/30 text-rose-400 border-rose-500/30"

  const glowColor =
    statusVal === "VERIFIED" ? "bg-emerald-500/10" :
    statusVal === "SUSPICIOUS" ? "bg-amber-500/10" : "bg-rose-500/10"

  const borderGlow =
    statusVal === "VERIFIED" ? "border-emerald-500/30" :
    statusVal === "SUSPICIOUS" ? "border-amber-500/30" : "border-rose-500/30"

  const indicatorColor = 
    statusVal === "VERIFIED" ? "bg-emerald-500" :
    statusVal === "SUSPICIOUS" ? "bg-amber-500" : "bg-rose-500"

  const indicatorPing = 
    statusVal === "VERIFIED" ? "bg-emerald-400" :
    statusVal === "SUSPICIOUS" ? "bg-amber-400" : "bg-rose-400"

  const scoreColor =
    authenticity_score >= 70 ? "text-emerald-400" :
    authenticity_score >= 50 ? "text-amber-400" : "text-rose-400"

  const riskColor =
    risk_level === "LOW" ? "text-emerald-400" :
    risk_level === "MEDIUM" ? "text-amber-400" : "text-rose-400"

  const checks = [
    { label: "Face Alignment Check", done: data.face_detected },
    { label: "Blink Liveness", done: data.challenge_completed?.blink ?? false },
    { label: "Head Turns Challenge", done: (data.challenge_completed?.turn_left ?? false) && (data.challenge_completed?.turn_right ?? false) },
    { label: "Deepfake Spoof Filter", done: risk_level === "LOW" },
  ]

  return (
    <div className="relative w-full mx-auto">
      {/* Light glow behind verified card */}
      <div className={`absolute -inset-1 rounded-2xl blur-xl transition-all duration-500 ${glowColor}`} />

      <div className={`relative bg-slate-900 border ${borderGlow} rounded-2xl p-6 shadow-2xl backdrop-blur-md`}>
        
        {/* Card Header Status */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${indicatorPing}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${indicatorColor}`} />
            </span>
            <h2 className="text-xs font-black text-slate-400 tracking-wider">
              VERIFICATION SUMMARY
            </h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${pillColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Verification status explanation reason */}
        {data.verification_reason && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-5 text-left">
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
              Decision Analysis
            </p>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed whitespace-pre-line">
              {data.verification_reason}
            </p>
          </div>
        )}

        {/* Small checklist of requirements */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {checks.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 bg-slate-950 border border-slate-800/60 rounded-xl px-3 py-2"
            >
              <span className={`text-xs font-black ${item.done ? "text-emerald-400" : "text-rose-500"}`}>
                {item.done ? "✓" : "✗"}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Telemetry Breakdown Details */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 text-center">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">
              Authenticity
            </p>
            <p className={`text-2xl font-black font-mono ${scoreColor}`}>
              {authenticity_score}%
            </p>
            <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase">{confidence_level} CONFIDENCE</p>
          </div>

          <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 text-center">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">
              Deepfake Risk
            </p>
            <p className={`text-2xl font-black font-mono ${riskColor}`}>
              {risk_level}
            </p>
            <p className="text-[9px] text-slate-500 font-bold mt-0.5 font-mono">
              p = {deepfake_probability?.toFixed(3) ?? "0.00"}
            </p>
          </div>
        </div>

        {/* Quality and Replay Badges */}
        {(data.quality_score !== undefined || data.replay_score !== undefined) && (
          <div className="grid grid-cols-2 gap-3 mb-5 text-[10px] text-slate-400">
            <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-2.5 flex justify-between items-center">
              <span className="font-semibold text-slate-500">Quality Score:</span>
              <span className="font-bold text-slate-200">{data.quality_score ? `${data.quality_score}%` : "N/A"}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-2.5 flex justify-between items-center">
              <span className="font-semibold text-slate-500">Replay Score:</span>
              <span className={`font-bold ${data.replay_detected ? 'text-rose-400' : 'text-slate-200'}`}>
                {data.replay_score !== undefined ? `${data.replay_score}` : "N/A"}
              </span>
            </div>
          </div>
        )}

        {/* Signature stamp */}
        <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
          <span>SmartFaceGuard Trust Engine</span>
          <span className="font-mono text-slate-500 normal-case">
            ID: {session_id ? session_id.substring(0, 12) : "sandbox_test"}
          </span>
        </div>
      </div>
    </div>
  )
}
