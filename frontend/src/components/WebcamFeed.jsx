import { useEffect, useRef, useState } from 'react'

export default function WebcamFeed({
  selectedCameraId = '',
  verificationActive = false,
  isPaused = false,
  customChallenge = 'blink',
  onFrame,
  faceDetected = false,
  capturedSnapshot = null,
  verificationStatus = '',
  onCameraDetected = null
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const onFrameRef = useRef(onFrame)
  const [cameraError, setCameraError] = useState(null)
  const [isMirrored, setIsMirrored] = useState(true)

  // Keep onFrameRef updated with latest reference
  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  // Stream management effect (Universal Live Camera)
  useEffect(() => {
    // If we have a snapshot, stop webcam stream to save resources
    if (capturedSnapshot) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      return
    }

    setCameraError(null)
    
    // Select constraints dynamically
    const constraints = {
      video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .catch(err => {
        console.warn("[WebcamFeed] Exact camera selection failed, falling back to default video input...", err)
        return navigator.mediaDevices.getUserMedia({ video: true })
      })
      .then((stream) => {
        streamRef.current = stream
        try {
          const videoTrack = stream.getVideoTracks()[0]
          if (videoTrack) {
            const label = videoTrack.label || "Live Camera"
            if (onCameraDetected) {
              onCameraDetected(label)
            }
            // Auto-detect virtual/OBS camera to disable mirroring
            const lowerLabel = label.toLowerCase()
            const isVirtual = lowerLabel.includes('obs') || lowerLabel.includes('virtual')
            setIsMirrored(!isVirtual)
          }
        } catch (e) {
          console.error("Failed to read camera label:", e)
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(err => {
                console.error("Camera playback start failed:", err)
              })
            }
          }
        }
      })
      .catch(err => {
        console.error("Camera access error:", err)
        setCameraError(err.message || "Permission denied or device occupied.")
      })

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [capturedSnapshot, selectedCameraId])

  // Frame capture loop
  useEffect(() => {
    let timeoutId
    
    // Determine frame interval. 250ms for head turns, 400ms for blink/center
    const getInterval = () => {
      if (customChallenge === 'turn_left' || customChallenge === 'turn_right') {
        return 250
      }
      return 400
    }

    const capture = () => {
      if (capturedSnapshot) return
      if (isPaused) {
        timeoutId = setTimeout(capture, 100)
        return
      }

      // Do NOT capture frames unless verification has been explicitly started
      if (!verificationActive) {
        timeoutId = setTimeout(capture, 100)
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === 4) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        if (onFrameRef.current) {
          onFrameRef.current(dataUrl)
        }
      }
      timeoutId = setTimeout(capture, getInterval())
    }

    capture()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [capturedSnapshot, isPaused, verificationActive, customChallenge])

  // Freeze Snapshot Render
  const isVerified = verificationStatus === "VERIFIED" || (!verificationStatus && faceDetected) // fallback
  const overlayClass = isVerified
    ? "border-emerald-500/80 bg-emerald-950/80 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
    : "border-rose-500/80 bg-rose-950/80 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl aspect-video max-w-full">
      {cameraError && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="h-11 w-11 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 text-lg font-bold mb-3 animate-pulse">
            !
          </div>
          <p className="text-sm font-bold text-white uppercase tracking-wider">Camera Access Blocked</p>
          <p className="text-[11px] text-slate-500 mt-2 max-w-xs leading-relaxed font-semibold">
            {cameraError}
          </p>
        </div>
      )}

      {capturedSnapshot ? (
        <div className="relative w-full h-full">
          <img
            src={capturedSnapshot}
            alt="Verification Snapshot"
            className={`w-full h-full object-cover filter brightness-90 ${
              isMirrored ? 'scale-x-[-1]' : ''
            }`}
          />
          {/* Animated scan freeze overlay */}
          <div className={`absolute inset-0 border-2 pointer-events-none flex flex-col items-center justify-center ${
            isVerified ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-rose-500/40 bg-rose-950/10'
          }`}>
            <div className={`px-6 py-2.5 rounded-xl border-2 backdrop-blur-md text-sm font-black tracking-widest uppercase ${overlayClass}`}>
              {isVerified ? "✓ Verified Snapshot" : "✗ Rejected Snapshot"}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onEnded={() => {}}
            className={`w-full h-full object-cover ${
              isMirrored ? 'scale-x-[-1]' : ''
            }`}
          />
          {/* Scanning line animation during active capture */}
          {verificationActive && !isPaused && (
            <div className="absolute left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-scan z-10 pointer-events-none" style={{
              animation: 'scan 2.5s linear infinite'
            }} />
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* SVG Face Oval Guide */}
      {!capturedSnapshot && !cameraError && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <svg
            className={`w-3/5 h-4/5 transition-all duration-300 ${
              faceDetected ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-slate-700'
            }`}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Oval frame */}
            <path
              d="M50 10C28 10 28 45 28 55C28 73 38 90 50 90C62 90 72 73 72 55C72 45 72 10 50 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 3"
            />
            {/* Corner tick marks */}
            <path d="M22 35V20H37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M78 35V20H63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M22 65V80H37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M78 65V80H63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Alert instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-slate-900/90 text-white rounded-lg text-[10px] font-extrabold tracking-widest text-center shadow-2xl border border-slate-800 uppercase">
        {capturedSnapshot 
          ? "VERIFICATION LOCK" 
          : cameraError 
          ? "CAMERA ERROR" 
          : faceDetected 
          ? "FACE ALIGNED" 
          : "ALIGN FACE IN GUIDE"}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan {
          animation: scan 2.5s linear infinite;
        }
      `}</style>
    </div>
  )
}
