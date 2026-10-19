import { useMemo } from 'react';
import './index.css';

/**
 * AiOrb - Interactive audio-reactive avatar for Natalie (AI Interviewer).
 * States:
 *  - 'speaking': Glowing ripple waves, energetic pulsating core, live 16-bar frequency visualizer
 *  - 'thinking': Rotating gradient orbital rings, cyan/purple shimmer aurora
 *  - 'listening': Gentle breathing glow, ready for candidate response
 *  - 'farewell': Warm triumphant emerald/gold aurora
 */
function AiOrb({ state = 'listening', isAudioPlaying = false }) {
  const activeState = isAudioPlaying ? 'speaking' : state;

  const statusLabel = useMemo(() => {
    switch (activeState) {
      case 'speaking':
        return 'Interviewer Speaking';
      case 'thinking':
        return 'Analyzing Rubrics...';
      case 'listening':
        return 'Active Listening';
      case 'farewell':
        return 'Session Concluded';
      default:
        return 'Online';
    }
  }, [activeState]);

  // Frequency bands array for speaking equalizer
  const EQ_BARS = [12, 28, 45, 78, 95, 60, 85, 100, 75, 90, 55, 80, 40, 65, 30, 15];

  return (
    <div className={`ai-orb-container state-${activeState}`}>
      {/* Outer ambient glow rings */}
      <div className="orb-ring ring-outer" />
      <div className="orb-ring ring-middle" />
      <div className="orb-ring ring-inner" />

      {/* Orbiting particles / shimmer rings */}
      <div className="orb-orbit-track">
        <div className="orb-satellite satellite-1" />
        <div className="orb-satellite satellite-2" />
        <div className="orb-satellite satellite-3" />
      </div>

      {/* Core glowing sphere */}
      <div className="orb-core">
        <div className="orb-plasma-layer" />
        <div className="orb-core-gradient" />
        <div className="orb-core-highlight" />

        {/* Audio reactive wavebars inside the orb when speaking */}
        {activeState === 'speaking' && (
          <div className="orb-wave-bars">
            <span className="wave-bar bar-1" />
            <span className="wave-bar bar-2" />
            <span className="wave-bar bar-3" />
            <span className="wave-bar bar-4" />
            <span className="wave-bar bar-5" />
          </div>
        )}

        {/* Thinking pulse icon */}
        {activeState === 'thinking' && (
          <div className="orb-thinking-spinner" />
        )}

        {/* Idle / Listening subtle iris */}
        {activeState === 'listening' && (
          <div className="orb-listening-pulse" />
        )}
      </div>

      {/* Live Audio Frequency Equalizer Strip */}
      <div className="orb-frequency-strip">
        {EQ_BARS.map((height, idx) => (
          <div
            key={idx}
            className={`freq-bar freq-${(idx % 4) + 1} ${activeState === 'speaking' ? 'active' : ''}`}
            style={{
              '--base-height': `${height}%`,
              animationDelay: `${(idx * 0.08).toFixed(2)}s`,
            }}
          />
        ))}
      </div>

      {/* Micro-label pill underneath */}
      <div className="orb-badge">
        <span className="orb-status-dot" />
        <span className="orb-status-text">{statusLabel}</span>
      </div>
    </div>
  );
}

export default AiOrb;
