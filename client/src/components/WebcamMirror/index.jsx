import { useState, useEffect, useRef } from 'react';
import {
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsArrowsAngleContract,
  BsArrowsAngleExpand,
  BsPersonFill,
  BsEyeFill,
} from 'react-icons/bs';
import './index.css';

/**
 * WebcamMirror - Candidate Self-View PIP Widget
 * Features:
 *  - Native WebRTC getUserMedia video feed
 *  - Eye-level framing guideline overlay
 *  - Live status indicator
 *  - Collapsible / Minimizable dock
 *  - Privacy toggle (Camera on/off)
 */
function WebcamMirror() {
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('mockint_cam_enabled') === 'true';
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [hasPermission, setHasPermission] = useState(null);
  const [streamError, setStreamError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function startStream() {
      if (!isEnabled) {
        stopStream();
        return;
      }

      try {
        setStreamError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 480 },
            height: { ideal: 360 },
            facingMode: 'user',
          },
          audio: false, // audio handled by VoiceRecorder
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        if (!active) return;
        console.warn('Webcam access error:', err.message);
        setHasPermission(false);
        setStreamError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied'
            : 'Camera unavailable'
        );
      }
    }

    startStream();

    return () => {
      active = false;
      stopStream();
    };
  }, [isEnabled]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    localStorage.setItem('mockint_cam_enabled', String(nextState));
  };

  return (
    <div
      className={`webcam-pip-widget ${isMinimized ? 'is-minimized' : ''} ${
        isEnabled && hasPermission ? 'is-live' : 'is-off'
      }`}
    >
      <div className="webcam-pip-header">
        <div className="pip-status-tag">
          {isEnabled && hasPermission ? (
            <>
              <span className="pip-live-dot" />
              <span className="pip-live-text">CAM LIVE</span>
            </>
          ) : (
            <span className="pip-off-text">CAM OFF</span>
          )}
        </div>

        <div className="pip-controls">
          {isEnabled && hasPermission && !isMinimized && (
            <button
              type="button"
              className={`pip-icon-btn ${showGuide ? 'active' : ''}`}
              title={showGuide ? 'Hide Eye Guide' : 'Show Eye Guide'}
              onClick={() => setShowGuide(!showGuide)}
            >
              <BsEyeFill />
            </button>
          )}

          <button
            type="button"
            className="pip-icon-btn"
            title={isMinimized ? 'Expand Camera' : 'Minimize Camera'}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <BsArrowsAngleExpand /> : <BsArrowsAngleContract />}
          </button>

          <button
            type="button"
            className={`pip-icon-btn ${isEnabled ? 'btn-active-cam' : ''}`}
            title={isEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            onClick={toggleCamera}
          >
            {isEnabled ? <BsCameraVideoFill /> : <BsCameraVideoOffFill />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="webcam-viewport">
          {isEnabled && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="webcam-video-element"
            />
          )}

          {(!isEnabled || !hasPermission) && (
            <div className="webcam-fallback-view">
              <div className="fallback-avatar-circle">
                <BsPersonFill className="fallback-avatar-icon" />
              </div>
              <p className="fallback-message">
                {streamError || (isEnabled ? 'Starting camera...' : 'Camera Off')}
              </p>
              <button
                type="button"
                className="webcam-enable-btn"
                onClick={toggleCamera}
              >
                {isEnabled ? 'Retry Camera' : 'Enable Video Mirror'}
              </button>
            </div>
          )}

          {isEnabled && hasPermission && showGuide && (
            <div className="webcam-eye-guide">
              <div className="guide-oval" />
              <span className="guide-label">Eye-Level Framing</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WebcamMirror;
