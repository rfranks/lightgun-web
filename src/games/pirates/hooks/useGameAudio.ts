"use client";
import { useAudio } from "@/hooks/useAudio";
import { useMemo, useCallback } from "react";

export function useGameAudio() {
  const shot = useAudio("/audio/laser4.ogg");
  const reload = useAudio("/audio/scratch_003.ogg");
  const hit = useAudio("/audio/explosionCrunch_001.ogg");

  const refs = useMemo(() => ({ shot, reload, hit }), [shot, reload, hit]);

  const play = useCallback(
    (key: keyof typeof refs) => {
      const ref = refs[key];
      if (ref.current) {
        ref.current.currentTime = 0;
        ref.current.play();
      }
    },
    [refs]
  );

  return { play };
}
