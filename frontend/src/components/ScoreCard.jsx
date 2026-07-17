import React from 'react'

export default function ScoreCard({ score = 0 }) {
  const color = score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400"
  const bgColor = score >= 70 ? "bg-emerald-950/20 border-emerald-500/25" : score >= 50 ? "bg-amber-950/20 border-amber-500/25" : "bg-rose-950/20 border-rose-500/25"
  const label = score >= 70 ? "High Trust" : score >= 50 ? "Medium Risk" : "Low Trust"

  // Circular progress calculations
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center shadow-xl flex flex-col items-center justify-center backdrop-blur-md">
      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-3 block">
        Authenticity Score
      </span>
      
      {/* Circular Progress Gauge */}
      <div className="relative flex items-center justify-center h-24 w-24 mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="text-slate-800"
            strokeWidth="6.5"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className={`transition-all duration-500 ease-out ${
              score >= 70 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500'
            }`}
            strokeWidth="6.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-2.5xl font-black text-white font-mono">{score}</span>
          <span className="text-[9px] text-slate-500 font-bold block -mt-1.5">/100</span>
        </div>
      </div>

      {/* Trust pill */}
      <span className={`inline-block px-3 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${bgColor} ${color}`}>
        {label}
      </span>
    </div>
  )
}
