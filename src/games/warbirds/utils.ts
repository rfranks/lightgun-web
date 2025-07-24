// src/games/warbirds/utils.ts
import { POWERUP_DURATION } from "@/constants/powerups";
import { AudioMgr } from "@/types/audio";
import { PowerupType } from "@/types/objects";
import { AssetMgr, Dims } from "@/types/ui";
import {
  MAX_AMMO,
  INITIAL_ENEMY_DENSITY,
  DEFAULT_CURSOR,
  ENEMY_SPEED,
  GROUND_SPEED,
  POWERUP_DEBUG,
} from "./constants";
import { GameState } from "./types";
import { Water } from "@/types/environment";

/**
 * Initializes the entire game state to default values, precisely matching index.tsx
 */
export function initState(
  dims: Dims,
  assets: AssetMgr,
  audio: AudioMgr
): GameState {
  const activePowerups: Record<PowerupType, { expires: number }> = {
    artillery: { expires: 0 },
    bomb: { expires: 0 },
    coin2x: { expires: 0 },
    ducksight: { expires: 0 },
    freeze: { expires: 0 },
    ghost: { expires: 0 },
    gunjam: { expires: 0 },
    heavy: { expires: 0 },
    homing: { expires: 0 },
    hourglass: { expires: 0 },
    infiniteAmmo: { expires: 0 },
    machineGuns: { expires: 0 },
    megaducks: { expires: 0 },
    magnet: { expires: 0 },
    napalm: { expires: 0 },
    shield: { expires: 0 },
    shrink: { expires: 0 },
    skull: { expires: 0 },
    spray: { expires: 0 },
    sticky: { expires: 0 },
    supermag: { expires: 0 },
    laserbeam: { expires: 0 },
    thunderstrike: { expires: 0 },
    windy: { expires: 0 },
    wings: { expires: 0 },
  };

  POWERUP_DEBUG.forEach((type) => {
    activePowerups[type].expires = POWERUP_DURATION;
  });

  const isActive = (t: PowerupType, frameCount: number): boolean =>
    activePowerups[t].expires > 0 && activePowerups[t].expires > frameCount;

  return {
    dims,
    assets,
    audio,

    cursor: DEFAULT_CURSOR,

    frameCount: 0,
    gameOver: false,

    y: dims.height * 0.2,
    vy: 0,
    groundOffset: 0,

    score: 0,
    ammo: MAX_AMMO,
    medalCount: 0,
    duckCount: 0,
    enemyCount: 0,

    dynamicDensity: INITIAL_ENEMY_DENSITY,

    enemies: [],
    airships: [],
    mountains: [],
    trees: [],
    clouds: [],
    waters: [],
    shotLakes: new Set<Water>(),
    ducks: [],
    powerups: [],
    medals: [],

    cannonballs: [],
    homingMissiles: [],
    artilleryShells: [],
    laserBeams: [],
    napalmMissiles: [],
    napalmTiles: [],
    laserBurstRemaining: 0,
    laserBurstCooldown: 0,
    burstRemaining: 0,
    burstCooldown: 0,

    puffs: [],
    sparkEffects: [],
    bulletHoles: [],
    floatingScores: [],
    falling: [],

    activePowerups,
    shieldFlash: 0,
    screenShake: 0,
    thunderCooldown: 0,

    crashed: false,
    crashHandled: false,
    groundCrashPuffsLeft: 0,

    planeFrame: 0,
    planeFrameCounter: 0,
    groundIndex: 0,
    planeAngle: 0,
    smokeSpawned: false,
    groundContactFrames: 0,

    whooshPlaying: false,
    artilleryPlaying: false,
    missileThrusterPlaying: false,

    textLabels: [],
    streak: 0,
    ouchFrames: 0,
    ouchExplodeIdx: 0,

    readyTimeout: 0,
    goTimeout: 0,
    beepTimeouts: [],

    isActive,
    enemySpeed: (frameCount: number) =>
      isActive("hourglass", frameCount) ? ENEMY_SPEED * 0.5 : ENEMY_SPEED,
    groundSpeed: (frameCount: number) =>
      isActive("hourglass", frameCount) ? GROUND_SPEED * 0.5 : GROUND_SPEED,
  };
}
