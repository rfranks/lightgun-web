import { RefObject } from "react";

/**
 * Pause an audio element referenced by a React ref. If the ref or element is
 * missing the call is safely ignored.
 */

export const pauseAudio = (audioRef?: RefObject<HTMLAudioElement | null>) => {
  if (!audioRef || !audioRef.current) return;
  audioRef.current.pause();
};

/**
 * Reset an audio element to the beginning and play it.
 *
 * @param audioRef React ref to the audio element.
 * @param options Optional loop/volume settings applied before playing.
 */
export const rewindAndPlayAudio = (
  audioRef?: RefObject<HTMLAudioElement | null>,
  options: { loop?: boolean; volume?: number } = {}
) => {
  if (!audioRef || !audioRef.current) return;
  if (options.loop) {
    audioRef.current.loop = true;
  } else {
    audioRef.current.loop = false;
  }
  if (options.volume !== undefined) {
    audioRef.current.volume = options.volume;
  } else {
    audioRef.current.volume = 1.0; // Default volume
  }
  // Rewind to start
  audioRef.current.currentTime = 0;
  // Play the audio
  audioRef.current.play();
};
