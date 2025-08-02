import { useCallback, useMemo } from "react";
import { AudioMgr } from "@/types/audio";
import { withBasePath } from "@/utils/basePath";

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
    shoot.src = withBasePath("/audio/laser4.ogg");
    shoot.preload = "auto";

    const hit = document.createElement("audio");
    hit.src = withBasePath("/audio/laser9.ogg");
    hit.preload = "auto";

    const bonus = document.createElement("audio");
    bonus.src = withBasePath("/audio/powerUp8.ogg"); // special-fish bonus
    bonus.preload = "auto";

    const penalty = document.createElement("audio");
    penalty.src = withBasePath("/audio/error_004.ogg"); // special-fish penalty
    penalty.preload = "auto";
    const skeleton = document.createElement("audio");
    skeleton.src = withBasePath("/audio/splash.ogg");
    skeleton.preload = "auto";

    const death = document.createElement("audio");
    death.src = withBasePath("/audio/lowDown.ogg");
    death.preload = "auto";

    const convert = document.createElement("audio");
    convert.src = withBasePath("/audio/zap1.ogg");
    convert.preload = "auto";

    const pop = document.createElement("audio");
    pop.src = withBasePath("/audio/glass_001.ogg");
    pop.preload = "auto";

    const bgm = document.createElement("audio");
    bgm.src = withBasePath("/audio/back_001.ogg");
    bgm.preload = "auto";
    bgm.loop = true;

    const tick = document.createElement("audio");
    tick.src = withBasePath("/audio/tick_002.ogg");
    tick.preload = "auto";

    return {
      shoot,
      hit,
      bonus,
      penalty,
      skeleton,
      death,
      convert,
      pop,
      tick,
      bgm,
    };
  }, []);

  // Play a sound by key
  const play = useCallback(
    (
      key: string,
      options?: { loop?: boolean; volume?: number }
    ) => {
      const audio = audios[key];
      if (audio) {
        if (options?.loop !== undefined) audio.loop = options.loop;
        if (options?.volume !== undefined) audio.volume = options.volume;
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
