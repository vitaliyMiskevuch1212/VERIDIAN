import { useRef } from 'react';

export default function useAudioContext() {
  const audioCtx = useRef(null);

  const getContext = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
    return audioCtx.current;
  };

  return { getContext };
}
