import { useEffect, useRef } from 'react';

function AudioPlayer({ audioBase64, onEnded, autoPlay = true }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioBase64) {
      if (onEnded) onEnded();
      return;
    }

    try {
      const src = audioBase64.startsWith('data:')
        ? audioBase64
        : `data:audio/mp3;base64,${audioBase64}`;

      const audio = new Audio(src);
      audioRef.current = audio;

      audio.onended = () => {
        if (onEnded) onEnded();
      };

      audio.onerror = (e) => {
        console.warn('Audio playback error:', e);
        if (onEnded) onEnded();
      };

      if (autoPlay) {
        audio.play().catch((err) => {
          console.warn('Audio autoPlay was prevented by browser:', err);
          if (onEnded) onEnded();
        });
      }
    } catch (err) {
      console.warn('AudioPlayer error:', err);
      if (onEnded) onEnded();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioBase64]);

  return null;
}

export default AudioPlayer;
