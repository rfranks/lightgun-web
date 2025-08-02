import { useCallback, useMemo } from "react";
import { AudioMgr } from "@/types/audio";

/**
 * Simple audio manager for Zombie Fish.
 * Loads core game sounds and exposes play / pause helpers.
 */
export function useGameAudio(): AudioMgr {
  // Load audio clips via <audio> elements
  const audios = useMemo<Record<string, HTMLAudioElement>>(() => {
    if (typeof Audio === "undefined")
      return {} as Record<string, HTMLAudioElement>;

    const shoot = document.createElement("audio");
    shoot.src = "/audio/laser4.ogg";
    shoot.preload = "auto";

    const hit = document.createElement("audio");
    hit.src = "/audio/laser9.ogg";
    hit.preload = "auto";

    const bonus = document.createElement("audio");
    bonus.src = "/audio/powerUp8.ogg"; // special-fish bonus
    bonus.preload = "auto";
    const skeleton = document.createElement("audio");
    skeleton.src = "/audio/splash.ogg";
    skeleton.preload = "auto";

    const convert = document.createElement("audio");
    convert.src = "/audio/zap1.ogg";
    convert.preload = "auto";

    return { shoot, hit, bonus, skeleton, convert };
  }, []);

  // Play a sound by key
  const play = useCallback(
    (key: string) => {
      const audio = audios[key];
      if (audio) {
        audio.currentTime = 0;
        void audio.play();
      }
    },
    [audios]
  );

  // Pause a sound by key
  const pause = useCallback(
    (key: string) => {
      const audio = audios[key];
      if (audio) {
        audio.pause();
      }
    },
    [audios]
  );

  // Pause all sounds (required by AudioMgr interface)
  const pauseAll = useCallback(() => {
    Object.values(audios).forEach((audio) => audio.pause());
  }, [audios]);

  return useMemo(
    () => ({
      play,
      pause,
      pauseAll,
    }),
    [play, pause, pauseAll]
  );
}
