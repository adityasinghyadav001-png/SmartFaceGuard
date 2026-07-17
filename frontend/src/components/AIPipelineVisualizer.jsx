import React from 'react'

const STAGES = [
  { id: 'camera', label: 'Camera / Video Feed', desc: 'Capturing optical input' },
  { id: 'face_detection', label: 'Face Detection', desc: 'Locating face boundary' },
  { id: 'alignment', label: 'Pose Alignment', desc: 'Calibrating 3D geometry' },
  { id: 'liveness', label: 'Liveness Challenges', desc: 'Verifying human interactivity' },
  { id: 'replay_detection', label: 'Replay Detection', desc: 'Filtering screen playbacks' },
  { id: 'deepfake_detection', label: 'Deepfake Analysis', desc: 'Checking CNN fake risk' },
  { id: 'decision_fusion', label: 'Decision Fusion', desc: 'Fusing pipeline metrics' },
  { id: 'result', label: 'Verification Result', desc: 'Authenticity decision output' }
]

export default function AIPipelineVisualizer({ activeStage }) {
  const getStageIndex = (stageId) => {
    return STAGES.findIndex(s => s.id === stageId)
  }

  const activeIdx = getStageIndex(activeStage)

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2.5 mb-4 border-b border-slate-800 pb-3">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </div>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          AI Pipeline Flow Architecture
        </span>
      </div>

      <div className="relative flex flex-col gap-3">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIdx
          const isActive = idx === activeIdx
          const isPending = idx > activeIdx

          // Icon and styling colors
          let statusColor = "border-slate-800 text-slate-600 bg-slate-950"
          let badgeText = "Pending"
          let badgeStyle = "bg-slate-950 text-slate-500 border-slate-800"

          if (isCompleted) {
            statusColor = "border-emerald-500/40 text-emerald-400 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
            badgeText = "Complete"
            badgeStyle = "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"
          } else if (isActive) {
            statusColor = "border-blue-500 text-blue-400 bg-blue-950/30 shadow-[0_0_15px_rgba(59,130,246,0.2)] animate-pulse"
            badgeText = "Processing"
            badgeStyle = "bg-blue-950/40 text-blue-400 border-blue-500/30 animate-pulse"
          }

          return (
            <div key={stage.id} className="relative">
              {/* Connector line between steps */}
              {idx < STAGES.length - 1 && (
                <div className="absolute left-[18px] top-9 w-[2px] h-[16px] z-0">
                  <div className={`w-full h-full rounded transition-all duration-300 ${
                    isCompleted ? 'bg-gradient-to-b from-emerald-500 to-slate-800' :
                    isActive ? 'bg-gradient-to-b from-blue-500/55 to-slate-900/55' : 'bg-slate-800/40'
                  }`} />
                  {isActive && (
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-400 animate-bounce opacity-80" />
                  )}
                </div>
              )}

              {/* Node Card */}
              <div className={`relative flex items-center justify-between border rounded-xl p-2.5 z-10 transition-all duration-300 ${
                isActive ? 'bg-slate-900/80 border-slate-700/80' : 'bg-slate-950/40 border-slate-900'
              }`}>
                <div className="flex items-center gap-3">
                  {/* Left Circle Indicator */}
                  <div className={`h-9 w-9 rounded-xl border flex items-center justify-center font-bold text-xs transition-all duration-300 ${statusColor}`}>
                    {isCompleted ? (
                      <span className="text-emerald-400 text-sm">✓</span>
                    ) : (
                      <span>0{idx + 1}</span>
                    )}
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold tracking-wide transition-colors ${
                      isActive ? 'text-blue-400 font-extrabold' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                    }`}>
                      {stage.label}
                    </h4>
                    <p className="text-[9px] text-slate-500/85 mt-0.5 tracking-normal leading-none font-semibold">
                      {stage.desc}
                    </p>
                  </div>
                </div>

                <span className={`text-[8px] font-bold uppercase border tracking-widest px-2 py-0.5 rounded ${badgeStyle}`}>
                  {badgeText}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
