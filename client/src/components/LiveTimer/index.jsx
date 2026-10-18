import { useState, useEffect } from 'react';
import { BsClockHistory } from 'react-icons/bs';
import './index.css';

/**
 * LiveTimer - Live question elapsed timer with real-time pacing feedback indicator.
 * Helps candidates practice timing discipline for technical & behavioral interviews.
 */
function LiveTimer({ questionNum, isListening = true }) {
  const [seconds, setSeconds] = useState(0);

  // Reset timer on new question
  useEffect(() => {
    setSeconds(0);
  }, [questionNum]);

  // Count up while listening / candidate's turn
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isListening, questionNum]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  // FAANG-standard interview pacing analysis
  let pacingClass = 'pacing-good';
  let pacingLabel = 'Ideal Pacing';

  if (seconds < 30) {
    pacingClass = 'pacing-warmup';
    pacingLabel = 'Starting Out';
  } else if (seconds <= 120) {
    pacingClass = 'pacing-good';
    pacingLabel = 'Ideal Pacing ✨';
  } else if (seconds <= 180) {
    pacingClass = 'pacing-detailed';
    pacingLabel = 'In-Depth 💡';
  } else {
    pacingClass = 'pacing-wrapup';
    pacingLabel = 'Wrap Up Soon ⏳';
  }

  return (
    <div className={`live-timer-container ${pacingClass}`}>
      <div className="live-timer-time">
        <BsClockHistory className="timer-icon" />
        <span className="timer-digits">{formatTime(seconds)}</span>
      </div>
      <div className={`pacing-badge ${pacingClass}`}>
        <span className="pacing-badge-dot" />
        <span className="pacing-badge-text">{pacingLabel}</span>
      </div>
    </div>
  );
}

export default LiveTimer;
