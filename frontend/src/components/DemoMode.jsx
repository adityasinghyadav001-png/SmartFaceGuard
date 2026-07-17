import React from 'react'

const DEMO_STEPS = [
  {
    face_detected: true,
    blink_count: 0,
    head_turn: "center",
    authenticity_score: 10,
    confidence_level: "LOW",
    current_challenge: "blink",
    challenge_completed: { blink: false, turn_left: false, turn_right: false },
    verification_complete: false,
    deepfake_probability: 0.0,
    risk_level: "LOW"
  },
  {
    face_detected: true,
    blink_count: 1,
    head_turn: "center",
    authenticity_score: 45,
    confidence_level: "MEDIUM",
    current_challenge: "turn_left",
    challenge_completed: { blink: true, turn_left: false, turn_right: false },
    verification_complete: false,
    deepfake_probability: 0.05,
    risk_level: "LOW"
  },
  {
    face_detected: true,
    blink_count: 1,
    head_turn: "left",
    authenticity_score: 70,
    confidence_level: "MEDIUM",
    current_challenge: "turn_right",
    challenge_completed: { blink: true, turn_left: true, turn_right: false },
    verification_complete: false,
    deepfake_probability: 0.06,
    risk_level: "LOW"
  },
  {
    face_detected: true,
    blink_count: 1,
    head_turn: "right",
    authenticity_score: 94,
    confidence_level: "HIGH",
    current_challenge: null,
    challenge_completed: { blink: true, turn_left: true, turn_right: true },
    verification_complete: true,
    deepfake_probability: 0.08,
    risk_level: "LOW"
  }
]

const STEP_DELAY_MS = 1000

export default function DemoMode({ onResult, running, setRunning }) {
  const runDemo = async () => {
    if (running) return

    setRunning(true)

    for (const step of DEMO_STEPS) {
      onResult(step)
      await new Promise((r) => setTimeout(r, STEP_DELAY_MS))
    }

    setRunning(false)
  }

  return (
    <button
      onClick={runDemo}
      disabled={running}
      className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-55 disabled:cursor-not-allowed text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-200 shadow-sm transition active:scale-98 text-center text-sm"
    >
      {running ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Running Demo...
        </span>
      ) : (
        "▶ Run Verification Demo"
      )}
    </button>
  )
}
