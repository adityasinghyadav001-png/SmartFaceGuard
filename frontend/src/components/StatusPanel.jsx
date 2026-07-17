import React from 'react'

export default function StatusPanel({ data }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-slate-300 h-full">
      {/* Face Detected */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between backdrop-blur-md">
        <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Face Detected</p>
        <p className={`text-lg font-black mt-1.5 ${data.face_detected ? 'text-emerald-400' : 'text-rose-500'}`}>
          {data.face_detected ? "DETECTED" : "NONE"}
        </p>
      </div>

      {/* Blink Count */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between backdrop-blur-md">
        <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Blink Count</p>
        <p className="text-lg font-black mt-1.5 text-blue-400 font-mono">
          {data.blink_count}
        </p>
      </div>

      {/* Head Turn */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between backdrop-blur-md">
        <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Head Position</p>
        <p className="text-lg font-black mt-1.5 text-slate-200 capitalize">
          {data.head_turn || "center"}
        </p>
      </div>

      {/* Deepfake Risk */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between backdrop-blur-md">
        <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Deepfake Risk</p>
        <p className={`text-sm font-black mt-1.5 ${
          data.risk_level === "LOW" ? "text-emerald-400" :
          data.risk_level === "MEDIUM" ? "text-amber-400" : "text-rose-500"
        }`}>
          {data.risk_level || "LOW"}
          <span className="text-[9px] text-slate-500 block font-bold font-mono -mt-0.5">
            p = {data.deepfake_probability?.toFixed(2) ?? "0.00"}
          </span>
        </p>
      </div>
    </div>
  )
}
