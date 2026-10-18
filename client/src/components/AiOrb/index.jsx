import { useMemo } from 'react';
import './index.css';

/**
 * AiOrb - Interactive audio-reactive avatar for Natalie (AI Interviewer).
 * States:
 *  - 'speaking': Glowing ripple waves, energetic pulsating core
 *  - 'thinking': Rotating gradient orbital rings, shimmer effect
 *  - 'listening': Gentle breathing glow, ready for candidate response
 *  - 'farewell': Warm triumphant emerald/gold aurora
 */
function AiOrb({ state = 'listening', isAudioPlaying = false }) {
  const activeState = isAudioPlaying ? 'speaking' : state;

  const statusLabel = useMemo(() => {
    switch (activeState) {
      case 'speaking':
        return 'Speaking';
      case 'thinking':
        return 'Analyzing...';
      case 'listening':
        return 'Listening to you';
      case 'farewell':
        return 'Complete';
      default:
        return 'Online';
    }
  }, [activeState]);

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
      </div>

      {/* Core glowing sphere */}
      <div className="orb-core">
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

      {/* Micro-label pill underneath */}
      <div className="orb-badge">
        <span className="orb-status-dot" />
        <span className="orb-status-text">{statusLabel}</span>
      </div>
    </div>
  );
}

export default AiOrb;
