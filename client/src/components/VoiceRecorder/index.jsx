import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { BsMicFill, BsRecordCircleFill, BsCheckCircleFill } from 'react-icons/bs';
import './index.css';

const MAX_RECORD_TIME = 300;

function VoiceRecorder({ onRecordingComplete, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORD_TIME) {
            stopRecording();
            return MAX_RECORD_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  const startRecording = async () => {
    chunksRef.current = [];
    setRecordingTime(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      toast.error('Could not access microphone. Please allow permissions or use text input.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (recordedBlob && onRecordingComplete) {
      onRecordingComplete(recordedBlob);
    }
  };

  const handleReRecord = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setRecordedBlob(null);
    setAudioPreviewUrl(null);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder">
      {!isRecording && !recordedBlob && (
        <button
          className={`vr-record-btn ${disabled ? 'vr-record-btn-disabled' : ''}`}
          onClick={startRecording}
          disabled={disabled}
        >
          <BsMicFill className="vr-btn-icon" />
          Record Answer
        </button>
      )}

      {isRecording && (
        <div className="vr-recording-area">
          <div className="vr-recording-status">
            <BsRecordCircleFill className="vr-record-dot" />
            <span className="vr-status-text">Recording...</span>
          </div>
          <span className="vr-timer">
            {formatTime(recordingTime)} / {formatTime(MAX_RECORD_TIME)}
          </span>
          <button className="vr-stop-btn" onClick={stopRecording}>
            Stop
          </button>
        </div>
      )}

      {!isRecording && recordedBlob && (
        <div className="vr-preview">
          <p className="vr-preview-label">
            Review your recording before submitting:
          </p>
          <audio
            className="vr-audio-player"
            src={audioPreviewUrl}
            controls
          />
          <p className="vr-preview-duration">
            Duration: {formatTime(recordingTime)}
          </p>
          <div className="vr-preview-actions">
            <button
              className={`vr-rerecord-btn ${disabled ? 'vr-rerecord-btn-disabled' : ''}`}
              onClick={handleReRecord}
              disabled={disabled}
            >
              Re-record
            </button>
            <button
              className={`vr-submit-btn ${disabled ? 'vr-submit-btn-disabled' : ''}`}
              onClick={handleSubmit}
              disabled={disabled}
            >
              <BsCheckCircleFill className="vr-btn-icon" />
              Submit Answer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;
