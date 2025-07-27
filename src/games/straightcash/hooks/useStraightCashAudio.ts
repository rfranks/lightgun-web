import { useCallback, useMemo, RefObject } from "react";
import { useAudio } from "@/hooks/useAudio";
import { AudioMgr } from "@/types/audio";
import { rewindAndPlayAudio, pauseAudio } from "@/utils/audio";

/**
 * Casino audio manager for Straight Cash.
 * Preloads common card and chip sounds.
 */
export function useStraightCashAudio(): AudioMgr {
  // ─── CARD SFX ─────────────────────────────────────────────────────────
  const cardFan1Sfx = useAudio("/audio/card-fan-1.ogg");
  const cardFan2Sfx = useAudio("/audio/card-fan-2.ogg");
  const cardPlace1Sfx = useAudio("/audio/card-place-1.ogg");
  const cardPlace2Sfx = useAudio("/audio/card-place-2.ogg");
  const cardPlace3Sfx = useAudio("/audio/card-place-3.ogg");
  const cardPlace4Sfx = useAudio("/audio/card-place-4.ogg");
  const cardShove1Sfx = useAudio("/audio/card-shove-1.ogg");
  const cardShove2Sfx = useAudio("/audio/card-shove-2.ogg");
  const cardShove3Sfx = useAudio("/audio/card-shove-3.ogg");
  const cardShove4Sfx = useAudio("/audio/card-shove-4.ogg");
  const cardShuffleSfx = useAudio("/audio/card-shuffle.ogg");
  const cardSlide1Sfx = useAudio("/audio/card-slide-1.ogg");
  const cardSlide2Sfx = useAudio("/audio/card-slide-2.ogg");
  const cardSlide3Sfx = useAudio("/audio/card-slide-3.ogg");
  const cardSlide4Sfx = useAudio("/audio/card-slide-4.ogg");
  const cardSlide5Sfx = useAudio("/audio/card-slide-5.ogg");
  const cardSlide6Sfx = useAudio("/audio/card-slide-6.ogg");
  const cardSlide7Sfx = useAudio("/audio/card-slide-7.ogg");
  const cardSlide8Sfx = useAudio("/audio/card-slide-8.ogg");
  const cardsPackOpen1Sfx = useAudio("/audio/cards-pack-open-1.ogg");
  const cardsPackOpen2Sfx = useAudio("/audio/cards-pack-open-2.ogg");
  const cardsPackTakeOut1Sfx = useAudio("/audio/cards-pack-take-out-1.ogg");
  const cardsPackTakeOut2Sfx = useAudio("/audio/cards-pack-take-out-2.ogg");

  // ─── WHEEL & PAYOUT SFX ──────────────────────────────────────────────
  const wheelSpinSfx = useAudio("/audio/whoosh.ogg", true);
  const payoutSfx = useAudio("/audio/confirmation_003.ogg");

  // ─── CHIP SFX ─────────────────────────────────────────────────────────
  const chipLay1Sfx = useAudio("/audio/chip-lay-1.ogg");
  const chipLay2Sfx = useAudio("/audio/chip-lay-2.ogg");
  const chipLay3Sfx = useAudio("/audio/chip-lay-3.ogg");
  const chipsCollide1Sfx = useAudio("/audio/chips-collide-1.ogg");
  const chipsCollide2Sfx = useAudio("/audio/chips-collide-2.ogg");
  const chipsCollide3Sfx = useAudio("/audio/chips-collide-3.ogg");
  const chipsCollide4Sfx = useAudio("/audio/chips-collide-4.ogg");
  const chipsHandle1Sfx = useAudio("/audio/chips-handle-1.ogg");
  const chipsHandle2Sfx = useAudio("/audio/chips-handle-2.ogg");
  const chipsHandle3Sfx = useAudio("/audio/chips-handle-3.ogg");
  const chipsHandle4Sfx = useAudio("/audio/chips-handle-4.ogg");
  const chipsHandle5Sfx = useAudio("/audio/chips-handle-5.ogg");
  const chipsHandle6Sfx = useAudio("/audio/chips-handle-6.ogg");
  const chipsStack1Sfx = useAudio("/audio/chips-stack-1.ogg");
  const chipsStack2Sfx = useAudio("/audio/chips-stack-2.ogg");
  const chipsStack3Sfx = useAudio("/audio/chips-stack-3.ogg");
  const chipsStack4Sfx = useAudio("/audio/chips-stack-4.ogg");
  const chipsStack5Sfx = useAudio("/audio/chips-stack-5.ogg");
  const chipsStack6Sfx = useAudio("/audio/chips-stack-6.ogg");

  // ─── DICE SFX ─────────────────────────────────────────────────────────
  const diceGrab1Sfx = useAudio("/audio/dice-grab-1.ogg");
  const diceGrab2Sfx = useAudio("/audio/dice-grab-2.ogg");
  const diceShake1Sfx = useAudio("/audio/dice-shake-1.ogg");
  const diceShake2Sfx = useAudio("/audio/dice-shake-2.ogg");
  const diceShake3Sfx = useAudio("/audio/dice-shake-3.ogg");
  const diceThrow1Sfx = useAudio("/audio/dice-throw-1.ogg");
  const diceThrow2Sfx = useAudio("/audio/dice-throw-2.ogg");
  const diceThrow3Sfx = useAudio("/audio/dice-throw-3.ogg");

  // ─── AUDIO REFS OBJECT (MEMOIZED) ─────────────────────────────────────
  const audioRefs = useMemo<Record<string, RefObject<HTMLAudioElement | null>>>(
    () => ({
      cardFan1Sfx,
      cardFan2Sfx,
      cardPlace1Sfx,
      cardPlace2Sfx,
      cardPlace3Sfx,
      cardPlace4Sfx,
      cardShove1Sfx,
      cardShove2Sfx,
      cardShove3Sfx,
      cardShove4Sfx,
      cardShuffleSfx,
      cardSlide1Sfx,
      cardSlide2Sfx,
      cardSlide3Sfx,
      cardSlide4Sfx,
      cardSlide5Sfx,
      cardSlide6Sfx,
      cardSlide7Sfx,
      cardSlide8Sfx,
      cardsPackOpen1Sfx,
      cardsPackOpen2Sfx,
      cardsPackTakeOut1Sfx,
      cardsPackTakeOut2Sfx,
      wheelSpinSfx,
      payoutSfx,
      chipLay1Sfx,
      chipLay2Sfx,
      chipLay3Sfx,
      chipsCollide1Sfx,
      chipsCollide2Sfx,
      chipsCollide3Sfx,
      chipsCollide4Sfx,
      chipsHandle1Sfx,
      chipsHandle2Sfx,
      chipsHandle3Sfx,
      chipsHandle4Sfx,
      chipsHandle5Sfx,
      chipsHandle6Sfx,
      chipsStack1Sfx,
      chipsStack2Sfx,
      chipsStack3Sfx,
      chipsStack4Sfx,
      chipsStack5Sfx,
      chipsStack6Sfx,
      diceGrab1Sfx,
      diceGrab2Sfx,
      diceShake1Sfx,
      diceShake2Sfx,
      diceShake3Sfx,
      diceThrow1Sfx,
      diceThrow2Sfx,
      diceThrow3Sfx,
    }),
    [
      cardFan1Sfx,
      cardFan2Sfx,
      cardPlace1Sfx,
      cardPlace2Sfx,
      cardPlace3Sfx,
      cardPlace4Sfx,
      cardShove1Sfx,
      cardShove2Sfx,
      cardShove3Sfx,
      cardShove4Sfx,
      cardShuffleSfx,
      cardSlide1Sfx,
      cardSlide2Sfx,
      cardSlide3Sfx,
      cardSlide4Sfx,
      cardSlide5Sfx,
      cardSlide6Sfx,
      cardSlide7Sfx,
      cardSlide8Sfx,
      cardsPackOpen1Sfx,
      cardsPackOpen2Sfx,
      cardsPackTakeOut1Sfx,
      cardsPackTakeOut2Sfx,
      wheelSpinSfx,
      payoutSfx,
      chipLay1Sfx,
      chipLay2Sfx,
      chipLay3Sfx,
      chipsCollide1Sfx,
      chipsCollide2Sfx,
      chipsCollide3Sfx,
      chipsCollide4Sfx,
      chipsHandle1Sfx,
      chipsHandle2Sfx,
      chipsHandle3Sfx,
      chipsHandle4Sfx,
      chipsHandle5Sfx,
      chipsHandle6Sfx,
      chipsStack1Sfx,
      chipsStack2Sfx,
      chipsStack3Sfx,
      chipsStack4Sfx,
      chipsStack5Sfx,
      chipsStack6Sfx,
      diceGrab1Sfx,
      diceGrab2Sfx,
      diceShake1Sfx,
      diceShake2Sfx,
      diceShake3Sfx,
      diceThrow1Sfx,
      diceThrow2Sfx,
      diceThrow3Sfx,
    ]
  );

  // ─── PLAY / PAUSE FUNCTIONS ───────────────────────────────────────────
  const play = useCallback(
    (key: string, options?: { loop?: boolean; volume?: number }) => {
      const audioRef = audioRefs[key];
      if (audioRef && audioRef.current) {
        rewindAndPlayAudio(
          audioRef,
          options || {
            loop: audioRef.current.loop,
            volume: audioRef.current.volume,
          }
        );
      }
    },
    [audioRefs]
  );

  const pause = useCallback(
    (key: string) => {
      const audioRef = audioRefs[key];
      if (audioRef && audioRef.current) {
        pauseAudio(audioRef);
      }
    },
    [audioRefs]
  );

  const pauseAll = useCallback(() => {
    Object.values(audioRefs).forEach((ref) => {
      if (ref.current) {
        pauseAudio(ref);
      }
    });
  }, [audioRefs]);

  return useMemo(
    () => ({
      play,
      pause,
      pauseAll,
    }),
    [play, pause, pauseAll]
  );
}

export default useStraightCashAudio;
