import { useCallback, useState, useRef, useEffect } from 'react'
import WebcamFeed from './components/WebcamFeed'
import StatusPanel from './components/StatusPanel'
import ScoreCard from './components/ScoreCard'
import ChallengePanel from './components/ChallengePanel'
import VerificationResultCard from './components/VerificationResultCard'
import VerificationTimeline from './components/VerificationTimeline'
import ScanningOverlay from './components/ScanningOverlay'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import AIPipelineVisualizer from './components/AIPipelineVisualizer'

const API_URL = "http://127.0.0.1:8000"

const INITIAL_DATA = {
  face_detected: false,
  blink_count: 0,
  head_turn: "none",
  authenticity_score: 0,
  confidence_level: "LOW",
  current_challenge: "blink",
  challenge_completed: { blink: false, turn_left: false, turn_right: false },
  verification_complete: false,
  deepfake_probability: 0.0,
  risk_level: "LOW",
  verification_status: "PENDING",
  verification_reason: "Verification in progress. Please complete the liveness challenges.",
  processing_time_ms: 0,
  verification_duration: 0,
  captured_frame: null,
  frames_processed: 0,
  average_frame_latency: 0,
  
  // Extra Telemetry Fields
  brightness: 0,
  contrast: 0,
  sharpness: 0,
  blur: 0,
  quality_score: 0,
  quality_label: "POOR",
  replay_detected: false,
  replay_score: 0.0,
  yaw: 0.0,
  pitch: 0.0,
  roll: 0.0,
  adaptive_threshold: 0.21
}

export default function App() {
  const [view, setView] = useState('landing') // 'landing' | 'verify' | 'dashboard'
  const [data, setData] = useState(INITIAL_DATA)
  const [sessionHistory, setSessionHistory] = useState([])
  const [capturedSnapshot, setCapturedSnapshot] = useState(null)
  
  // Camera selection states
  const [cameraList, setCameraList] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedCameraLabel, setSelectedCameraLabel] = useState('Detecting camera...')
  const [verificationActive, setVerificationActive] = useState(false)

  // Frontend flow control state machine
  const [customChallenge, setCustomChallenge] = useState('blink') // 'blink' | 'turn_left' | 'turn_right' | 'processing' | 'completed'
  const [holdProgress, setHoldProgress] = useState(0) // 0 to 5 frames
  const [activePipelineStage, setActivePipelineStage] = useState('camera') // camera, face_detection, alignment, liveness, replay_detection, deepfake_detection, decision_fusion, result
  const [isPaused, setIsPaused] = useState(false)

  const sessionIdRef = useRef(null)
  const isAnalyzingRef = useRef(false)

  // Enumerate cameras
  const refreshCameraList = async () => {
    try {
      // Prompt for temporary permission if labels are empty
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setCameraList(videoDevices)
      
      if (videoDevices.length > 0) {
        // Fallback to select first device if none is selected
        setSelectedCamera(prev => {
          if (prev && videoDevices.some(d => d.deviceId === prev)) {
            return prev
          }
          const defaultDevice = videoDevices[0]
          setSelectedCameraLabel(defaultDevice.label || "Live Camera")
          return defaultDevice.deviceId
        })
      }
    } catch (e) {
      console.error("Failed to enumerate camera devices:", e)
    }
  }

  // Refresh lists on load and listen to hardware changes
  useEffect(() => {
    if (view === 'verify') {
      refreshCameraList()
    }
  }, [view])

  useEffect(() => {
    navigator.mediaDevices.addEventListener('devicechange', refreshCameraList)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshCameraList)
    }
  }, [])

  const handleReset = async (keepVerificationActive = false) => {
    try {
      const headers = {}
      if (sessionIdRef.current) {
        headers['X-Session-ID'] = sessionIdRef.current
      }
      const res = await fetch(`${API_URL}/reset`, {
        method: 'POST',
        headers
      })
      const json = await res.json()
      if (json.session_id) {
        sessionIdRef.current = json.session_id
      }
      
      // Reset state machine
      setCapturedSnapshot(null)
      setData(INITIAL_DATA)
      setCustomChallenge('blink')
      setHoldProgress(0)
      setActivePipelineStage('camera')
      setIsPaused(false)
      if (!keepVerificationActive) {
        setVerificationActive(false)
      }
    } catch (err) {
      console.error("Reset error:", err)
      setCapturedSnapshot(null)
      setData(INITIAL_DATA)
      setCustomChallenge('blink')
      setHoldProgress(0)
      setActivePipelineStage('camera')
      setIsPaused(false)
      if (!keepVerificationActive) {
        setVerificationActive(false)
      }
    }
  }

  const switchCamera = (deviceId) => {
    const device = cameraList.find(d => d.deviceId === deviceId)
    if (device) {
      setSelectedCamera(deviceId)
      setSelectedCameraLabel(device.label || "Live Camera")
      handleReset(false)
    }
  }

  const startVerification = async () => {
    await handleReset(true)
    setVerificationActive(true)
  }

  const stopVerification = () => {
    setVerificationActive(false)
    handleReset(false)
  }

  // Push session to history logs when verification succeeds
  const logSessionResult = useCallback((sessionData) => {
    const isVerified = sessionData.verification_status 
      ? sessionData.verification_status === "VERIFIED"
      : (sessionData.authenticity_score >= 70 && sessionData.risk_level === "LOW")

    const sessionKey = sessionData.session_id 
      ? `sf_${sessionData.session_id.substring(0, 8)}`
      : `sf_${Math.random().toString(36).substring(2, 10)}`
    
    const newLog = {
      id: sessionKey,
      name: selectedCameraLabel ? `Camera: ${selectedCameraLabel}` : "Sandbox User Check",
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      authenticity_score: sessionData.authenticity_score,
      confidence_level: sessionData.confidence_level,
      risk_level: sessionData.risk_level,
      deepfake_probability: sessionData.deepfake_probability,
      status: isVerified ? "Verified" : "Suspicious",
      face_detected: sessionData.face_detected,
      blink_count: sessionData.blink_count,
      head_turn: (sessionData.challenge_completed?.turn_left && sessionData.challenge_completed?.turn_right) ? "completed" : "incomplete",
      
      // Performance details:
      verification_status: sessionData.verification_status || (isVerified ? "VERIFIED" : "SUSPICIOUS"),
      verification_reason: sessionData.verification_reason || "",
      processing_time_ms: sessionData.processing_time_ms || 0,
      verification_duration: sessionData.verification_duration || 0,
      frames_processed: sessionData.frames_processed || 0,
      average_frame_latency: sessionData.average_frame_latency || 0,

      // Telemetry:
      brightness: sessionData.brightness || 0,
      contrast: sessionData.contrast || 0,
      sharpness: sessionData.sharpness || 0,
      blur: sessionData.blur || 0,
      quality_score: sessionData.quality_score || 0,
      quality_label: sessionData.quality_label || "POOR",
      replay_detected: sessionData.replay_detected || false,
      replay_score: sessionData.replay_score || 0.0,
      yaw: sessionData.yaw || 0.0,
      pitch: sessionData.pitch || 0.0,
      roll: sessionData.roll || 0.0,
      adaptive_threshold: sessionData.adaptive_threshold || 0.21
    }

    setSessionHistory(prev => {
      if (prev.some(s => s.id === newLog.id)) return prev
      return [newLog, ...prev]
    })
  }, [selectedCameraLabel])

  const handleFrame = useCallback(async (dataUrl) => {
    if (customChallenge === 'completed' || customChallenge === 'processing') return
    if (isPaused) return
    if (isAnalyzingRef.current) return

    isAnalyzingRef.current = true
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (sessionIdRef.current) {
        headers['X-Session-ID'] = sessionIdRef.current
      }

      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: dataUrl })
      })
      const json = await res.json()

      if (json.error) {
        console.error("Analyze error:", json.error)
        return
      }

      if (json.session_id) {
        sessionIdRef.current = json.session_id
      }

      // Update state data
      setData(json)

      // Pipeline State Machine Navigation
      if (!json.face_detected) {
        setActivePipelineStage('camera')
      } else {
        if (customChallenge === 'blink') {
          setActivePipelineStage('liveness')
          
          if (json.challenge_completed?.blink) {
            // Blink challenge completed, start transition
            setIsPaused(true)
            setTimeout(() => {
              setCustomChallenge('turn_left')
              setHoldProgress(0)
              setIsPaused(false)
            }, 700)
          }
        } 
        else if (customChallenge === 'turn_left') {
          setActivePipelineStage('liveness')
          
          // Require 2-second hold progression (5 frames)
          if (json.head_turn === 'left') {
            setHoldProgress(prev => Math.min(5, prev + 1))
          } else {
            setHoldProgress(prev => Math.max(0, prev - 1))
          }

          if (json.challenge_completed?.turn_left) {
            // Turn Left challenge completed, start transition
            setIsPaused(true)
            setTimeout(() => {
              setCustomChallenge('turn_right')
              setHoldProgress(0)
              setIsPaused(false)
            }, 700)
          }
        }
        else if (customChallenge === 'turn_right') {
          setActivePipelineStage('liveness')
          
          // Require 2-second hold progression (5 frames)
          if (json.head_turn === 'right') {
            setHoldProgress(prev => Math.min(5, prev + 1))
          } else {
            setHoldProgress(prev => Math.max(0, prev - 1))
          }

          if (json.challenge_completed?.turn_right) {
            // All liveness done. Wait 700ms and run the sequential decision engine presentation
            setIsPaused(true)
            setTimeout(() => {
              setCustomChallenge('processing')
              
              // Sequence the stage visualization highlights
              setActivePipelineStage('replay_detection')
              
              setTimeout(() => {
                setActivePipelineStage('deepfake_detection')
                
                setTimeout(() => {
                  setActivePipelineStage('decision_fusion')
                  
                  setTimeout(() => {
                    setActivePipelineStage('result')
                    setCustomChallenge('completed')
                    setCapturedSnapshot(json.captured_frame || dataUrl)
                    logSessionResult(json)
                    setVerificationActive(false)
                  }, 500)
                }, 500)
              }, 500)

            }, 700)
          }
        }
      }
    } catch (err) {
      console.error("Frame analysis request failed:", err)
    } finally {
      isAnalyzingRef.current = false
    }
  }, [customChallenge, isPaused, logSessionResult])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setView('landing')}>
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <span className="font-black text-sm">SF</span>
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight text-md block">SmartFaceGuard</span>
              <span className="text-[9px] text-slate-550 font-bold tracking-widest uppercase block -mt-0.5">Identity & Trust</span>
            </div>
          </div>

          <nav className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setView('landing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${view === 'landing' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-400 hover:text-white'}`}
            >
              Overview
            </button>
            <button
              onClick={() => { setView('verify'); handleReset(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${view === 'verify' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-400 hover:text-white'}`}
            >
              Verify Arena
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${view === 'dashboard' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-400 hover:text-white'}`}
            >
              Dashboard Logs
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        {view === 'landing' && (
          <LandingPage 
            onStartVerify={() => { setView('verify'); handleReset(); }} 
            onViewDashboard={() => setView('dashboard')} 
          />
        )}

        {view === 'dashboard' && (
          <Dashboard 
            sessionHistory={sessionHistory} 
            onStartVerify={() => { setView('verify'); handleReset(); }} 
          />
        )}

        {view === 'verify' && (
          <div className="py-10 px-6 max-w-7xl mx-auto">
            <div className="mb-8 text-center max-w-xl mx-auto">
              <span className="text-[10px] uppercase font-black text-blue-500 tracking-widest">Verification Arena</span>
              <h2 className="text-3xl font-black text-white tracking-tight mt-1">Liveness Biometric Sandbox</h2>
              <p className="text-slate-400 text-xs mt-1.5 font-semibold leading-relaxed">
                Redesigned interface for commercial hackathon stage validation. Test the liveness verification pipeline in real-time or switch input cameras.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Webcam Viewport Column (Left) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-2xl relative overflow-hidden">
                  {/* Status Indicator Left */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-2.5 py-1 bg-slate-950/90 border border-slate-850 rounded-lg shadow-xl">
                    <span className={`h-2 w-2 rounded-full ${verificationActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-[9px] font-black text-slate-350 uppercase tracking-widest">
                      {verificationActive ? 'Verification Active' : 'Camera Ready'}
                    </span>
                  </div>
                  
                  {/* Camera Name Indicator Right */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-2.5 py-1 bg-slate-950/90 border border-slate-850 rounded-lg shadow-xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {selectedCameraLabel}
                    </span>
                  </div>

                  <WebcamFeed
                    selectedCameraId={selectedCamera}
                    verificationActive={verificationActive}
                    isPaused={isPaused}
                    customChallenge={customChallenge}
                    onFrame={handleFrame}
                    faceDetected={data.face_detected}
                    capturedSnapshot={capturedSnapshot}
                    verificationStatus={data.verification_status}
                    onCameraDetected={setSelectedCameraLabel}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  {/* Camera Source Selector Card (Premium Glassmorphism) */}
                  <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4 shadow-xl backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-20 w-20 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-2.5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Camera Source</span>
                        <span className="text-[9px] text-slate-500 font-bold mt-0.5">
                          Select input device for verification
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 border border-slate-850 rounded-lg">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">LIVE</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <div className="relative w-full md:flex-1">
                        <select
                          value={selectedCamera}
                          onChange={(e) => switchCamera(e.target.value)}
                          disabled={verificationActive}
                          className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 disabled:opacity-50 hover:bg-slate-900 transition-all cursor-pointer appearance-none pr-10"
                        >
                          {cameraList.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label || `Camera (${device.deviceId.substring(0, 5)})`}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500 text-[10px]">
                          ▼
                        </div>
                      </div>
                      
                      <button
                        onClick={verificationActive ? stopVerification : startVerification}
                        className={`w-full md:w-auto px-6 py-3 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg text-center active:scale-[0.98] ${
                          verificationActive 
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/10'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10'
                        }`}
                      >
                        {verificationActive ? '⏹ Stop' : '▶ Start Verification'}
                      </button>
                    </div>

                    {/* OBS Virtual Camera Attack Simulation Warning Tag */}
                    {(selectedCameraLabel.toUpperCase().includes('OBS') || 
                      selectedCameraLabel.toUpperCase().includes('VIRTUAL CAMERA')) && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-950/20 border border-amber-900/40 rounded-xl">
                        <span className="text-[11px] animate-pulse">⚠️</span>
                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">
                          Attack Simulation Mode Active (OBS feed detection)
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleReset(false)}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-350 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition active:scale-[0.98] text-center"
                  >
                    Reset Challenge Session
                  </button>
                </div>
              </div>

              {/* Status and Telemetry Column (Right) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Liveness challenge active instructions */}
                <ChallengePanel
                  customChallenge={customChallenge}
                  completed={data.challenge_completed}
                  verificationComplete={data.verification_complete}
                  holdProgress={holdProgress}
                />

                {/* AI Pipeline Flowchart */}
                <AIPipelineVisualizer activeStage={activePipelineStage} />

                {/* System check checklist */}
                <ScanningOverlay data={data} customChallenge={customChallenge} />

                {/* Score representation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ScoreCard score={data.authenticity_score} />
                  <StatusPanel data={data} />
                </div>

                {/* Telemetry output timeline & final card */}
                <VerificationTimeline data={data} customChallenge={customChallenge} activePipelineStage={activePipelineStage} />
                <VerificationResultCard data={data} customChallenge={customChallenge} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
