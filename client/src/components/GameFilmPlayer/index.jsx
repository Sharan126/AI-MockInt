import React, { useState, useRef, useEffect } from 'react';
import {
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiVolume2,
  FiUser,
  FiSliders,
} from 'react-icons/fi';
import { BsFilm, BsHeadphones } from 'react-icons/bs';
import './index.css';

const GameFilmPlayer = ({ messages = [], interviewerPersona = 'Natalie' }) => {
  // Pair messages into question & answer exchange turns
  const turns = [];
  let currentTurn = null;

  messages.forEach((msg, idx) => {
    if (msg.role === 'interviewer') {
      if (currentTurn) turns.push(currentTurn);
      currentTurn = {
        id: turns.length + 1,
        question: msg.content,
        questionAudio: msg.audio || null,
        candidateAnswer: '',
        candidateAudio: null,
        timestamp: msg.timestamp,
      };
    } else if (msg.role === 'candidate') {
      if (currentTurn) {
        currentTurn.candidateAnswer = msg.content;
        currentTurn.candidateAudio = msg.audio || null;
        turns.push(currentTurn);
        currentTurn = null;
      } else {
        turns.push({
          id: turns.length + 1,
          question: 'Candidate Statement',
          questionAudio: null,
          candidateAnswer: msg.content,
          candidateAudio: msg.audio || null,
          timestamp: msg.timestamp,
        });
      }
    }
  });

  if (currentTurn) turns.push(currentTurn);

  const [activeTurnIdx, setActiveTurnIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playingRole, setPlayingRole] = useState(null); // 'question' | 'candidate'
  const audioRef = useRef(null);

  const activeTurn = turns[activeTurnIdx] || null;

  // Handle Play/Stop for a specific role in current turn
  const playAudioTrack = (type, audioSrc) => {
    if (!audioSrc) return;

    if (audioRef.current) {
      if (playingRole === type && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setPlayingRole(null);
        return;
      }
      audioRef.current.pause();
    }

    const audio = new Audio(audioSrc);
    audio.playbackRate = playbackSpeed;
    audio.onended = () => {
      setIsPlaying(false);
      setPlayingRole(null);
    };
    audio.onerror = () => {
      setIsPlaying(false);
      setPlayingRole(null);
    };

    audioRef.current = audio;
    setPlayingRole(type);
    setIsPlaying(true);
    audio.play().catch((err) => {
      console.warn('Audio play error:', err);
      setIsPlaying(false);
    });
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const changeSpeed = () => {
    const speeds = [1, 1.25, 1.5, 1.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  if (!turns || turns.length === 0) {
    return null;
  }

  return (
    <div className="game-film-player">
      <div className="game-film-header">
        <div className="gfp-title-group">
          <div className="gfp-icon-badge">
            <BsFilm className="gfp-icon" />
          </div>
          <div>
            <h3 className="gfp-title">Audio "Game Film" Session Replay</h3>
            <p className="gfp-subtitle">
              Review your interview exchange-by-exchange with synchronized audio & transcripts
            </p>
          </div>
        </div>

        <div className="gfp-controls-bar">
          <button
            className="gfp-btn speed"
            onClick={changeSpeed}
            title="Toggle playback speed"
          >
            <FiSliders /> {playbackSpeed}x
          </button>
          <div className="gfp-turn-nav">
            <button
              className="gfp-nav-btn"
              disabled={activeTurnIdx === 0}
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
                setPlayingRole(null);
                setActiveTurnIdx((p) => p - 1);
              }}
            >
              <FiSkipBack />
            </button>
            <span className="gfp-turn-counter">
              Turn {activeTurnIdx + 1} of {turns.length}
            </span>
            <button
              className="gfp-nav-btn"
              disabled={activeTurnIdx === turns.length - 1}
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
                setPlayingRole(null);
                setActiveTurnIdx((p) => p + 1);
              }}
            >
              <FiSkipForward />
            </button>
          </div>
        </div>
      </div>

      {/* Turn Scrubber Timeline */}
      <div className="turn-timeline-scrubber">
        {turns.map((t, idx) => (
          <button
            key={t.id}
            className={`timeline-chip ${idx === activeTurnIdx ? 'active' : ''}`}
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              setIsPlaying(false);
              setPlayingRole(null);
              setActiveTurnIdx(idx);
            }}
          >
            <span className="chip-label">T{idx + 1}</span>
            {t.candidateAudio && <span className="chip-voice-dot" title="Voice recorded" />}
          </button>
        ))}
      </div>

      {/* Active Turn Exchange View */}
      {activeTurn && (
        <div className="turn-exchange-box">
          {/* Question Track */}
          <div className="track-card interviewer">
            <div className="track-header">
              <div className="track-speaker">
                <div className="speaker-avatar persona">
                  <BsHeadphones />
                </div>
                <div>
                  <span className="speaker-name">{interviewerPersona} (Interviewer)</span>
                  <span className="speaker-action">Posed the prompt</span>
                </div>
              </div>

              {activeTurn.questionAudio && (
                <button
                  className={`track-play-btn ${
                    playingRole === 'question' && isPlaying ? 'playing' : ''
                  }`}
                  onClick={() => playAudioTrack('question', activeTurn.questionAudio)}
                >
                  {playingRole === 'question' && isPlaying ? <FiPause /> : <FiPlay />}
                  <span>{playingRole === 'question' && isPlaying ? 'Pause AI Voice' : 'Play AI Voice'}</span>
                </button>
              )}
            </div>
            <div className="track-transcript question-text">
              {activeTurn.question}
            </div>
          </div>

          {/* Candidate Response Track */}
          <div className="track-card candidate">
            <div className="track-header">
              <div className="track-speaker">
                <div className="speaker-avatar user">
                  <FiUser />
                </div>
                <div>
                  <span className="speaker-name">Your Response</span>
                  <span className="speaker-action">What you stated</span>
                </div>
              </div>

              {activeTurn.candidateAudio ? (
                <button
                  className={`track-play-btn candidate ${
                    playingRole === 'candidate' && isPlaying ? 'playing' : ''
                  }`}
                  onClick={() => playAudioTrack('candidate', activeTurn.candidateAudio)}
                >
                  {playingRole === 'candidate' && isPlaying ? <FiPause /> : <FiPlay />}
                  <span>{playingRole === 'candidate' && isPlaying ? 'Pause My Voice' : 'Play My Voice'}</span>
                </button>
              ) : (
                <span className="no-audio-tag">Voice synthesis text mode</span>
              )}
            </div>
            <div className="track-transcript candidate-text">
              {activeTurn.candidateAnswer || '(No candidate answer recorded for this turn)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameFilmPlayer;
