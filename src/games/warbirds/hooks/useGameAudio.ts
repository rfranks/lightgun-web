// hooks/useGameAudio.ts
import { useCallback, useMemo, RefObject } from "react";
import { useAudio } from "@/hooks/useAudio";
import { AudioMgr } from "@/types/audio";
import { rewindAndPlayAudio, pauseAudio } from "@/utils/audio";

/**
 * Provides an audio manager for playing and pausing game SFX.
 * All returned methods are memoized to ensure stable references.
 *
 * @returns {AudioMgr} Object with play, pause, and pauseAll methods.
 */
export function useGameAudio(): AudioMgr {
  // ─── AUDIO REFS ─────────────────────────────────────────────────────────
  const artillerySfx = useAudio("/audio/whistle_fall.ogg", true);
  const artilleryExplodeSfx = useAudio("/audio/explosionCrunch_000.ogg");
  const artillerySplashSfx = useAudio("/audio/splash.ogg");
  const beepSfx = useAudio("/audio/drop_003.ogg");
  const boopSfx = useAudio("/audio/drop_004.ogg");
  const bombSfx = useAudio("/audio/explosionCrunch_004.ogg");
  const cannonballSfx = useAudio("/audio/laserRetro_000.ogg");
  const crashSfx = useAudio("/audio/explosionCrunch_002.ogg");
  const duckSfx = useAudio("/audio/select_003.ogg");
  const enemyHitSfx = useAudio("/audio/laser9.ogg");
  const flapSfx = useAudio("/audio/click_001.ogg");
  const flightSfx = useAudio("/audio/engineCircular_001.ogg", true);
  const gameOverSfx = useAudio("/audio/select_005.ogg");
  const groundTouchSfx = useAudio("/audio/explosionCrunch_002.ogg");
  const homingExplSfx = useAudio("/audio/explosionCrunch_001.ogg");
  const medalSfx = useAudio("/audio/confirmation_003.ogg");
  const napalmExplodeSfx = useAudio("audio/explosionCrunch_000.ogg");
  const powerupSfx = useAudio("/audio/powerUp8.ogg");
  const reloadSfx = useAudio("/audio/scratch_003.ogg");
  const shieldSfx = useAudio("/audio/forceField_002.ogg");
  const shrinkSfx = useAudio("/audio/phaserDown1.ogg");
  const skullSfx = useAudio("/audio/lowDown.ogg");
  const shotSfx = useAudio("/audio/laser4.ogg");
  const thunderSfx = useAudio("/audio/thunderstrike.ogg");
  const thrusterSfx = useAudio("/audio/thrusterFire_000.ogg", true);
  const whooshSfx = useAudio("/audio/whoosh.ogg", true);

  // ─── AUDIO REFS OBJECT (MEMOIZED) ───────────────────────────────────────
  /**
   * Maps audio keys to their respective refs.
   * Memoized so its reference is stable unless dependencies change.
   */
  const audioRefs = useMemo<Record<string, RefObject<HTMLAudioElement | null>>>(
    () => ({
      artillerySfx,
      artilleryExplodeSfx,
      artillerySplashSfx,
      beepSfx,
      boopSfx,
      bombSfx,
      cannonballSfx,
      crashSfx,
      duckSfx,
      enemyHitSfx,
      flapSfx,
      flightSfx,
      gameOverSfx,
      groundTouchSfx,
      homingExplSfx,
      medalSfx,
      napalmExplodeSfx,
      powerupSfx,
      reloadSfx,
      shieldSfx,
      shrinkSfx,
      skullSfx,
      shotSfx,
      thunderSfx,
      thrusterSfx,
      whooshSfx,
    }),
    [
      artillerySfx,
      artilleryExplodeSfx,
      artillerySplashSfx,
      beepSfx,
      boopSfx,
      bombSfx,
      cannonballSfx,
      crashSfx,
      duckSfx,
      enemyHitSfx,
      flapSfx,
      flightSfx,
      gameOverSfx,
      groundTouchSfx,
      homingExplSfx,
      medalSfx,
      napalmExplodeSfx,
      powerupSfx,
      reloadSfx,
      shieldSfx,
      shrinkSfx,
      skullSfx,
      shotSfx,
      thunderSfx,
      thrusterSfx,
      whooshSfx,
    ]
  );

  /**
   * Plays a sound effect by key. Memoized for referential stability.
   */
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

  /**
   * Pauses a sound effect by key. Memoized for referential stability.
   */
  const pause = useCallback(
    (key: string) => {
      const audioRef = audioRefs[key];
      if (audioRef && audioRef.current) {
        pauseAudio(audioRef);
      }
    },
    [audioRefs]
  );

  /**
   * Pauses all sound effects. Memoized for referential stability.
   */
  const pauseAll = useCallback(() => {
    Object.values(audioRefs).forEach((ref) => {
      if (ref.current) {
        pauseAudio(ref);
      }
    });
  }, [audioRefs]);

  // ─── AUDIO MANAGER RETURN ───────────────────────────────────────────────
  return useMemo(
    () => ({
      play,
      pause,
      pauseAll,
    }),
    [play, pause, pauseAll]
  );
}
