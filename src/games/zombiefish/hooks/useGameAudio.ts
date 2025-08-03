import { useCallback, useMemo, useRef } from "react";
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

    const create = (src: string, loop = false) => {
      const audio = document.createElement("audio");
      audio.src = withBasePath(src);
      audio.preload = "auto";
      audio.loop = loop;
      return audio;
    };

    const base: Record<string, HTMLAudioElement> = {
      shoot: create("/audio/laser4.ogg"),
      hit: create("/audio/laser9.ogg"),
      bonus: create("/audio/powerUp8.ogg"), // special-fish bonus
      penalty: create("/audio/error_004.ogg"), // special-fish penalty
      skeleton: create("/audio/splash.ogg"),
      death: create("/audio/lowDown.ogg"),
      convert: create("/audio/zap1.ogg"),
      pop: create("/audio/glass_001.ogg"),
      tick: create("/audio/tick_002.ogg"),
      warning: create("/audio/warning.ogg"),
    };

    for (let i = 0; i <= 16; i++) {
      const key = `jingles_NES${i.toString().padStart(2, "0")}`;
      base[key] = create(`/audio/${key}.ogg`);
    }

    return base;
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
  const seqRef = useRef<{
    current?: HTMLAudioElement;
    handler?: () => void;
  }>();

  const pauseAll = useCallback(() => {
    Object.values(audios).forEach((audio) => audio.pause());
    const seq = seqRef.current;
    if (seq?.current && seq.handler) {
      seq.current.removeEventListener("ended", seq.handler);
    }
    seqRef.current = undefined;
  }, [audios]);

  const playSequence = useCallback(
    (keys: string[], options?: { loop?: boolean; volume?: number }) => {
      if (!keys.length) return;
      let index = 0;
      const playNext = () => {
        const key = keys[index];
        const audio = audios[key];
        if (!audio) return;
        if (options?.volume !== undefined) audio.volume = options.volume;
        audio.currentTime = 0;
        const handler = () => {
          audio.removeEventListener("ended", handler);
          index += 1;
          if (index >= keys.length) {
            if (options?.loop) {
              index = 0;
            } else {
              seqRef.current = undefined;
              return;
            }
          }
          playNext();
        };
        seqRef.current = { current: audio, handler };
        audio.addEventListener("ended", handler);
        void audio.play();
      };
      playNext();
    },
    [audios]
  );

  return useMemo(
    () => ({
      play,
      playSequence,
      pause,
      pauseAll,
    }),
    [play, playSequence, pause, pauseAll]
  );
}
