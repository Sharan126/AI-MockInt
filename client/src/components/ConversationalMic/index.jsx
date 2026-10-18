import { useState, useEffect, useRef } from 'react';
import { BsMicFill } from 'react-icons/bs';
import './index.css';

const SILENCE_TIMEOUT = 3000;

function ConversationalMic({ onTranscriptReady, onAutoSubmit, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (finalChunk) {
        setFinalText((prev) => prev + finalChunk);
      }
      setLiveText(interim);
      startSilenceTimer();
    };

    recognition.onerror = (e) => {
      console.warn('SpeechRecognition error:', e);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setAutoSubmitCountdown(null);
  };

  const startSilenceTimer = () => {
    clearSilenceTimer();
    let timeLeft = Math.floor(SILENCE_TIMEOUT / 1000);
    setAutoSubmitCountdown(timeLeft);

    countdownTimerRef.current = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        clearInterval(countdownTimerRef.current);
        setAutoSubmitCountdown(null);
      } else {
        setAutoSubmitCountdown(timeLeft);
      }
    }, 1000);

    silenceTimerRef.current = setTimeout(() => {
      handleAutoSubmit();
    }, SILENCE_TIMEOUT);
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      clearSilenceTimer();
    } catch (e) {
      console.warn('Already listening:', e);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (e) {
      console.warn('Stop listening error:', e);
    }
  };

  const handleAutoSubmit = () => {
    stopListening();
    const full = (finalText + ' ' + liveText).trim();
    if (full && onAutoSubmit) {
      onAutoSubmit(full);
    }
  };

  const handleManualSubmit = () => {
    clearSilenceTimer();
    stopListening();
    const full = (finalText + ' ' + liveText).trim();
    if (full && onTranscriptReady) {
      onTranscriptReady(full);
    }
  };

  const handleRestart = () => {
    clearSilenceTimer();
    setFinalText('');
    setLiveText('');
    startListening();
  };

  const displayText = (finalText + ' ' + liveText).trim();

  if (!isSupported) {
    return (
      <div className="cm-unsupported">
        <p className="cm-unsupported-text">
          Voice recognition is not supported in this browser. Please use Chrome
          or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="cm-container">
      <div className="cm-mic-button-wrapper">
        <button
          className={`cm-mic-button ${isListening ? 'cm-mic-active' : ''} ${disabled ? 'cm-mic-button-disabled' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
        >
          <BsMicFill className="cm-mic-icon" />
        </button>
      </div>

      <div className="cm-status">
        {isListening && !displayText && (
          <p className="cm-status-listening">Listening...</p>
        )}
        {isListening && displayText && !autoSubmitCountdown && (
          <p className="cm-status-listening">Hearing you...</p>
        )}
        {autoSubmitCountdown && (
          <p className="cm-status-countdown">
            Submitting in {autoSubmitCountdown}s...{' '}
            <button
              className="cm-keep-talking-btn"
              onClick={() => {
                clearSilenceTimer();
                startListening();
              }}
            >
              Keep talking
            </button>
          </p>
        )}
        {!isListening && displayText && (
          <p className="cm-status-done">Done</p>
        )}
        {!isListening && !displayText && (
          <p className="cm-status-ready">Ready to listen</p>
        )}
      </div>

      {displayText && (
        <div className="cm-transcript-box">
          <span className="cm-transcript-final">{finalText}</span>
          {liveText && (
            <span className="cm-transcript-interim">{liveText}</span>
          )}
        </div>
      )}

      <div className="cm-controls">
        {isListening ? (
          <button
            className={`cm-submit-btn ${!displayText ? 'cm-submit-btn-disabled' : ''}`}
            onClick={handleManualSubmit}
            disabled={!displayText}
          >
            Submit Answer
          </button>
        ) : displayText ? (
          <div className="cm-done-actions">
            <button className="cm-speak-again-btn" onClick={handleRestart}>
              Speak Again
            </button>
            <button className="cm-submit-btn" onClick={handleManualSubmit}>
              Submit Answer
            </button>
          </div>
        ) : (
          <button
            className={`cm-start-btn ${disabled ? 'cm-start-btn-disabled' : ''}`}
            onClick={startListening}
            disabled={disabled}
          >
            Start listening
          </button>
        )}
      </div>
    </div>
  );
}

export default ConversationalMic;
