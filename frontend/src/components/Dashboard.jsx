import React, { useState } from 'react'

const initialMockLogs = [
  {
    id: "sf_628a8d5c",
    name: "Eleanor Vance",
    timestamp: "2026-06-13 14:15:32",
    authenticity_score: 94,
    confidence_level: "HIGH",
    risk_level: "LOW",
    deepfake_probability: 0.04,
    status: "Verified",
    face_detected: true,
    blink_count: 2,
    head_turn: "completed"
  },
  {
    id: "sf_9b2e1f40",
    name: "Arthur Pendelton",
    timestamp: "2026-06-13 13:42:10",
    authenticity_score: 22,
    confidence_level: "LOW",
    risk_level: "HIGH",
    deepfake_probability: 0.93,
    status: "Suspicious",
    face_detected: true,
    blink_count: 0,
    head_turn: "failed"
  },
  {
    id: "sf_a7c3b2e9",
    name: "Marcus Vance",
    timestamp: "2026-06-13 11:20:05",
    authenticity_score: 88,
    confidence_level: "HIGH",
    risk_level: "LOW",
    deepfake_probability: 0.08,
    status: "Verified",
    face_detected: true,
    blink_count: 1,
    head_turn: "completed"
  },
  {
    id: "sf_7f4d9c2e",
    name: "Julia Roberts (Clone)",
    timestamp: "2026-06-13 09:05:44",
    authenticity_score: 35,
    confidence_level: "MEDIUM",
    risk_level: "HIGH",
    deepfake_probability: 0.81,
    status: "Suspicious",
    face_detected: true,
    blink_count: 1,
    head_turn: "completed"
  },
  {
    id: "sf_8e1a3b5c",
    name: "Sophia Martinez",
    timestamp: "2026-06-12 18:30:12",
    authenticity_score: 97,
    confidence_level: "HIGH",
    risk_level: "LOW",
    deepfake_probability: 0.02,
    status: "Verified",
    face_detected: true,
    blink_count: 2,
    head_turn: "completed"
  }
]

export default function Dashboard({ sessionHistory = [] }) {
  // Combine custom sessionHistory with mock logs
  const combinedHistory = [...sessionHistory, ...initialMockLogs]
  const [selectedSession, setSelectedSession] = useState(combinedHistory[0])
  const [filter, setFilter] = useState('All')

  // Makers Conclave Evaluation States
  const [realTests, setRealTests] = useState(0)
  const [aiTests, setAiTests] = useState(0)
  const [falsePositives, setFalsePositives] = useState(0)
  const [falseNegatives, setFalseNegatives] = useState(0)

  // Calculations for Makers Conclave Evaluation Statistics
  const totalEntered = realTests + aiTests
  const correctDecisions = (realTests - falsePositives) + (aiTests - falseNegatives)
  const accuracy = totalEntered > 0 ? ((correctDecisions / totalEntered) * 100).toFixed(1) : "100.0"

  const verifiedCount = combinedHistory.filter(s => s.status === 'Verified' || s.verification_status === 'VERIFIED').length
  const rejectedCount = combinedHistory.filter(s => s.verification_status === 'REJECTED').length
  const suspiciousCount = combinedHistory.filter(s => s.status === 'Suspicious' && s.verification_status !== 'REJECTED').length

  const logsWithLatency = combinedHistory.filter(s => s.processing_time_ms)
  const avgLatency = logsWithLatency.length > 0 
    ? `${(logsWithLatency.reduce((acc, s) => acc + (s.average_frame_latency || s.processing_time_ms), 0) / logsWithLatency.length).toFixed(1)} ms`
    : "N/A"

  const filteredHistory = combinedHistory.filter(session => {
    if (filter === 'All') return true
    return session.status === filter
  })

  // Calculate high-level stats
  const total = combinedHistory.length
  const passRate = total > 0 ? ((verifiedCount / total) * 100).toFixed(1) : 0
  const avgScore = total > 0 ? (combinedHistory.reduce((acc, s) => acc + s.authenticity_score, 0) / total).toFixed(0) : 0

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 p-6 md:p-10 relative overflow-hidden">
      {/* Background glowing elements */}
      <div className="absolute top-0 right-0 h-96 w-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Developer Analytics Console
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Real-time monitoring of active session verifications and deepfake risk models.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-400">Model Engine v1.4.2 Active</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Checks</p>
            <p className="text-3xl font-black text-white mt-2">{total}</p>
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono">Sandbox & Live events</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pass Rate</p>
            <p className="text-3xl font-black text-white mt-2">{passRate}%</p>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500">Industry benchmark: 92.4%</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Trust Score</p>
            <p className="text-3xl font-black text-white mt-2">{avgScore}<span className="text-lg text-slate-500">/100</span></p>
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono font-bold">Confidence margin &plusmn;3%</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suspicious Intercepts</p>
            <p className="text-3xl font-black text-rose-500 mt-2">{suspiciousCount + rejectedCount}</p>
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono font-bold">Deepfake & spoofing flags</p>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Logs Table (Left 8 Columns) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Table Header Filter */}
            <div className="px-6 py-5 border-b border-slate-850 flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-black text-white text-md tracking-wide">Verification Logs</h2>
              <div className="flex bg-slate-950 p-0.5 rounded-lg text-[10px] border border-slate-850 font-bold uppercase tracking-wider">
                {['All', 'Verified', 'Suspicious'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1.5 rounded transition ${filter === tab ? 'bg-slate-900 text-white shadow-md border border-slate-800' : 'text-slate-550 hover:text-white'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 text-slate-500 uppercase text-[9px] font-bold tracking-widest border-b border-slate-850">
                    <th className="py-3 px-6">Session ID</th>
                    <th className="py-3 px-6">Subject</th>
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-6 text-center">Score</th>
                    <th className="py-3 px-6 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-350">
                  {filteredHistory.map((session) => {
                    const dispStatus = session.verification_status || (session.status === 'Verified' ? 'VERIFIED' : 'SUSPICIOUS')
                    const dispStatusLabel = 
                      dispStatus === "VERIFIED" ? "Verified" :
                      dispStatus === "SUSPICIOUS" ? "Suspicious" :
                      dispStatus === "REJECTED" ? "Rejected" : "Failed"
                    
                    return (
                      <tr
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`hover:bg-slate-850/40 cursor-pointer transition ${selectedSession?.id === session.id ? 'bg-slate-850/60' : ''}`}
                      >
                        <td className="py-4 px-6 font-mono text-[10px] font-bold text-slate-500">{session.id}</td>
                        <td className="py-4 px-6 font-bold text-white text-xs">{session.name}</td>
                        <td className="py-4 px-6 text-slate-500 text-[10px] font-bold">{session.timestamp}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`font-mono font-black text-xs ${session.authenticity_score >= 70 ? 'text-emerald-400' : session.authenticity_score >= 50 ? 'text-amber-400' : 'text-rose-500'}`}>
                            {session.authenticity_score}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-wider ${
                            dispStatusLabel === 'Verified' 
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' :
                              dispStatusLabel === 'Suspicious'
                              ? 'bg-amber-950/20 text-amber-400 border-amber-500/20'
                              : 'bg-rose-950/20 text-rose-400 border-rose-500/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              dispStatusLabel === 'Verified' ? 'bg-emerald-500' :
                              dispStatusLabel === 'Suspicious' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            {dispStatusLabel}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-550 text-xs font-semibold">
                        No sessions found for this status.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Panel & Makers Conclave Evaluation Widget (Right 4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {selectedSession ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest font-mono">Telemetry Inspector</span>
                  <h3 className="font-black text-white text-md mt-1">{selectedSession.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {selectedSession.id}</p>
                </div>

                {/* Status Box */}
                <div className={`p-4 rounded-xl border ${
                  selectedSession.status === 'Verified' 
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-950/20 border-rose-500/20 text-rose-450'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Verification State</span>
                    <span className={`text-[10px] font-black tracking-widest ${selectedSession.status === 'Verified' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedSession.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Explainable Decision reason */}
                {selectedSession.verification_reason && (
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-[10px] text-slate-400 font-semibold whitespace-pre-line leading-relaxed">
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1 font-sans">
                      Audit Log Reason
                    </p>
                    {selectedSession.verification_reason}
                  </div>
                )}

                {/* Core Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-center">
                    <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Authenticity</span>
                    <span className={`text-xl font-black font-mono ${selectedSession.authenticity_score >= 70 ? 'text-emerald-450' : 'text-rose-450'}`}>
                      {selectedSession.authenticity_score}%
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-center">
                    <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Deepfake Risk</span>
                    <span className={`text-xl font-black font-mono ${selectedSession.risk_level === 'LOW' ? 'text-emerald-455' : 'text-rose-455'}`}>
                      {selectedSession.risk_level}
                    </span>
                  </div>
                </div>

                {/* Telemetry Details */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-3 text-[11px] text-slate-400 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Face Detected:</span>
                    <span className="font-extrabold text-slate-200">{selectedSession.face_detected ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Blink Count:</span>
                    <span className="font-extrabold text-slate-200">{selectedSession.blink_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Head Turns Check:</span>
                    <span className="font-extrabold text-slate-200 capitalize">{selectedSession.head_turn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Deepfake Probability:</span>
                    <span className="font-mono font-extrabold text-slate-200">p = {selectedSession.deepfake_probability}</span>
                  </div>
                  {/* Image Quality Metrics */}
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-500 font-bold">Quality Index:</span>
                    <span className="font-extrabold text-slate-200">
                      {selectedSession.quality_score ? `${selectedSession.quality_score}% (${selectedSession.quality_label})` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Brightness / Contrast:</span>
                    <span className="font-mono font-extrabold text-slate-200">
                      {selectedSession.brightness !== undefined ? `${selectedSession.brightness} / ${selectedSession.contrast}` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Sharpness / Blur:</span>
                    <span className="font-mono font-extrabold text-slate-200">
                      {selectedSession.sharpness !== undefined ? `${selectedSession.sharpness} / ${selectedSession.blur}` : "N/A"}
                    </span>
                  </div>
                  {/* Replay Detection */}
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-500 font-bold">Replay Detected:</span>
                    <span className={`font-extrabold ${selectedSession.replay_detected ? 'text-rose-400' : 'text-emerald-450'}`}>
                      {selectedSession.replay_detected !== undefined ? (selectedSession.replay_detected ? "Spoof Flagged" : "No Spoof") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Replay Attack Score:</span>
                    <span className="font-mono font-extrabold text-slate-200">
                      {selectedSession.replay_score !== undefined ? `s = ${selectedSession.replay_score}` : "N/A"}
                    </span>
                  </div>
                  {/* Head Pose Euler Angles */}
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-500 font-bold">Head Pose Angles:</span>
                    <span className="font-mono font-extrabold text-slate-200">
                      {selectedSession.yaw !== undefined ? `Y:${selectedSession.yaw}° P:${selectedSession.pitch}° R:${selectedSession.roll}°` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Adaptive EAR Thresh:</span>
                    <span className="font-mono font-extrabold text-slate-200">
                      {selectedSession.adaptive_threshold !== undefined ? `${selectedSession.adaptive_threshold}` : "N/A"}
                    </span>
                  </div>
                  {/* Performance metrics display */}
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-500 font-bold">Processing Time:</span>
                    <span className="font-mono font-extrabold text-slate-200">{selectedSession.processing_time_ms ? `${selectedSession.processing_time_ms} ms` : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Verification Duration:</span>
                    <span className="font-mono font-extrabold text-slate-200">{selectedSession.verification_duration ? `${selectedSession.verification_duration} s` : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Frames Processed:</span>
                    <span className="font-mono font-extrabold text-slate-200">{selectedSession.frames_processed || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Avg Frame Latency:</span>
                    <span className="font-mono font-extrabold text-slate-200">
                      {selectedSession.average_frame_latency 
                        ? `${selectedSession.average_frame_latency} ms` 
                        : selectedSession.frames_processed && selectedSession.processing_time_ms 
                          ? `${(selectedSession.processing_time_ms / selectedSession.frames_processed).toFixed(2)} ms`
                          : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Trust Audit Checklist */}
                <div className="mt-1">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2.5">Trust Checklist</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center font-extrabold ${selectedSession.face_detected ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950 text-rose-400 border border-rose-500/20'}`}>✓</span>
                      <span className="text-slate-400 font-semibold">Landmarks detected</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center font-extrabold ${selectedSession.blink_count > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950 text-rose-450 border border-rose-500/20'}`}>
                        {selectedSession.blink_count > 0 ? '✓' : '✗'}
                      </span>
                      <span className="text-slate-400 font-semibold">Active eye blink challenge</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center font-extrabold ${selectedSession.head_turn === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950 text-rose-455 border border-rose-500/20'}`}>
                        {selectedSession.head_turn === 'completed' ? '✓' : '✗'}
                      </span>
                      <span className="text-slate-400 font-semibold">Gaze alignment shifts</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center font-extrabold ${selectedSession.risk_level === 'LOW' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950 text-rose-455 border border-rose-500/20'}`}>
                        {selectedSession.risk_level === 'LOW' ? '✓' : '✗'}
                      </span>
                      <span className="text-slate-400 font-semibold">Generative noise analysis (Deepfake)</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                Select a verification session to inspect telemetry details.
              </div>
            )}

            {/* Makers Conclave Evaluation Statistics Widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 relative overflow-hidden flex flex-col">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-widest font-mono">Makers Conclave</span>
                <h3 className="font-black text-white text-sm mt-0.5 uppercase tracking-wide">Evaluation Statistics</h3>
                <p className="text-[10px] text-slate-450 font-semibold">Log and verify benchmark metrics during live demo testing.</p>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Real Tests</label>
                  <input
                    type="number"
                    min="0"
                    value={realTests}
                    onChange={(e) => setRealTests(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-black font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">AI/Spoof Tests</label>
                  <input
                    type="number"
                    min="0"
                    value={aiTests}
                    onChange={(e) => setAiTests(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-black font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">False Positives</label>
                  <input
                    type="number"
                    min="0"
                    value={falsePositives}
                    onChange={(e) => setFalsePositives(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-black font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">False Negatives</label>
                  <input
                    type="number"
                    min="0"
                    value={falseNegatives}
                    onChange={(e) => setFalseNegatives(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-black font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Calculated Results */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-2.5 text-xs text-slate-400 font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Accuracy:</span>
                  <span className={`font-mono font-black text-sm ${parseFloat(accuracy) >= 90 ? 'text-emerald-450' : parseFloat(accuracy) >= 70 ? 'text-amber-450' : 'text-rose-455'}`}>
                    {accuracy}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Verified:</span>
                  <span className="font-extrabold text-slate-200">{verifiedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Suspicious:</span>
                  <span className="font-extrabold text-slate-200">{suspiciousCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Rejected:</span>
                  <span className="font-extrabold text-slate-200">{rejectedCount}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="text-slate-500 font-bold">Avg Processing Time:</span>
                  <span className="font-mono font-extrabold text-slate-200">{avgLatency}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
