import React from 'react'

export default function LandingPage({ onStartVerify, onOpenDashboard }) {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 relative overflow-hidden">
      {/* Background glowing elements */}
      <div className="absolute top-0 right-0 h-96 w-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 h-80 w-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-6 shadow-2xl backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Enterprise Trust Verification Platform
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight max-w-3xl leading-tight">
          Verify digital identity with <span className="text-blue-500 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">absolute confidence</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed font-medium">
          Real-time, browser-based face verification with active liveness validation, passive deepfake prevention, and instant authenticity scoring. Built for secure onboarding.
        </p>

        {/* Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <button
            onClick={onStartVerify}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-center"
          >
            Launch Identity Sandbox
          </button>
          <button
            onClick={onOpenDashboard}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold rounded-xl border border-slate-800 hover:border-slate-700 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-center"
          >
            Open Developer Console
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-20 w-full max-w-4xl border-t border-slate-900 pt-10">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-6">
            Trusted by security-focused platforms worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40 hover:opacity-80 transition duration-300">
            <span className="text-lg font-black tracking-widest text-slate-400 uppercase">Stripe</span>
            <span className="text-lg font-black tracking-widest text-slate-400 uppercase">Persona</span>
            <span className="text-lg font-black tracking-widest text-slate-400 uppercase">Okta</span>
            <span className="text-lg font-black tracking-widest text-slate-400 uppercase">Onfido</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-slate-900/40 border-t border-b border-slate-900 py-20 px-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Enterprise-Grade Biometric Security
            </h2>
            <p className="mt-4 text-slate-400 font-medium text-sm">
              SmartFaceGuard combines multi-layered detection engines to establish high-confidence identity trust inside the browser in under 10 seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 hover:border-blue-500/20 transition-all duration-300 group">
              <div className="h-10 w-10 bg-blue-950 border border-blue-900 text-blue-400 rounded-xl flex items-center justify-center font-bold text-md mb-4 group-hover:scale-105 transition-all">
                01
              </div>
              <h3 className="font-bold text-white text-md mb-2">Face Detection</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Real-time landmark mapping tracks facial positioning, lighting quality, and gaze alignment within the capture area.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 hover:border-blue-500/20 transition-all duration-300 group">
              <div className="h-10 w-10 bg-blue-950 border border-blue-900 text-blue-400 rounded-xl flex items-center justify-center font-bold text-md mb-4 group-hover:scale-105 transition-all">
                02
              </div>
              <h3 className="font-bold text-white text-md mb-2">Active Liveness</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Prompts users with dynamic, random challenges like blinking and head turns to thwart static photo or pre-recorded video spoofing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 hover:border-blue-500/20 transition-all duration-300 group">
              <div className="h-10 w-10 bg-blue-950 border border-blue-900 text-blue-400 rounded-xl flex items-center justify-center font-bold text-md mb-4 group-hover:scale-105 transition-all">
                03
              </div>
              <h3 className="font-bold text-white text-md mb-2">Deepfake Analysis</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Evaluates generative noise, micro-textures, and compression artifacts to detect AI-generated synthetic faces and avatars.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 hover:border-blue-500/20 transition-all duration-300 group">
              <div className="h-10 w-10 bg-blue-950 border border-blue-900 text-blue-400 rounded-xl flex items-center justify-center font-bold text-md mb-4 group-hover:scale-105 transition-all">
                04
              </div>
              <h3 className="font-bold text-white text-md mb-2">Authenticity Scoring</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Combines biometrics and neural net risk assessments into a single 0-100 trust score for automated or manual decision flows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Integration */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-2xl relative z-10">
            <h2 className="text-3xl font-black tracking-tight mb-4">
              Integrate in minutes, scale to millions
            </h2>
            <p className="text-slate-450 text-sm mb-8 leading-relaxed font-semibold">
              We provide developer-friendly SDKs, webhook listeners, and detailed API responses designed to seamlessly plug into any onboarding workflow.
            </p>
            <button
              onClick={onStartVerify}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition duration-300"
            >
              Get Sandbox Credentials
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black">
              SF
            </span>
            <span className="font-bold text-white tracking-tight">SmartFaceGuard</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} SmartFaceGuard Inc. All rights reserved. Built for security & compliance.
          </p>
        </div>
      </footer>
    </div>
  )
}
