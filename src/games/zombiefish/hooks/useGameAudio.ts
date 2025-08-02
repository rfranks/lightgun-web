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
    const skeleton = document.createElement("audio");
    skeleton.src = withBasePath("/audio/splash.ogg");
    skeleton.preload = "auto";

    const death = document.createElement("audio");
    death.src = "/audio/lowDown.ogg";
    death.preload = "auto";

    const convert = document.createElement("audio");
    convert.src = withBasePath("/audio/zap1.ogg");
    convert.preload = "auto";

    const bgm = document.createElement("audio");
    bgm.src = withBasePath("/audio/back_001.ogg");
    bgm.preload = "auto";
    bgm.loop = true;

    return { shoot, hit, bonus, skeleton, death, convert, bgm };
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
