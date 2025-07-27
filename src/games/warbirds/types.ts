/**
 * Warbirds-specific types/extensions.
 * (Add any unique, game-specific interfaces here.)
 */
import type { AssetMgr, Dims, TextLabel } from "@/types/ui";
import type { Enemy, Airship } from "@/types/vehicles";
import type {
  HomingMissile,
  NapalmMissile,
  NapalmTile,
  ArtilleryShell,
} from "@/types/weapons";
import type { Puff, SparkEffect } from "@/types/effects";
import type { Tree, Mountain, Cloud, Water } from "@/types/environment";
import type { Powerup, PowerupType, Medal, Duck } from "@/types/objects";
import { AudioMgr } from "@/types/audio";

export type GamePhase = "title" | "ready" | "go" | "playing";

/**
 * All mutable gameplay state, lifted out of index.tsx refs & useState.
 */
export interface GameState {
  // wiring
  dims: Dims;
  assets: AssetMgr;
  audio: AudioMgr;

  // current cursor
  cursor: string;

  // loop control
  frameCount: number;
  gameOver: boolean;

  // player physics & position
  y: number;
  vy: number;
  groundOffset: number;

  // player stats
  score: number;
  ammo: number;
  medalCount: number;
  duckCount: number;
  enemyCount: number;

  // spawn density
  dynamicDensity: number;

  // entity lists
  enemies: Enemy[];
  airships: Airship[];
  ducks: Duck[];
  mountains: Mountain[];
  trees: Tree[];
  clouds: Cloud[];
  waters: Water[];
  shotLakes: Set<Water>;
  powerups: Powerup[];
  medals: Medal[];

  // projectiles & weapons
  cannonballs: { x: number; y: number; vx: number; img: HTMLImageElement }[];
  homingMissiles: HomingMissile[];
  napalmMissiles: NapalmMissile[];
  napalmTiles: NapalmTile[];
  artilleryShells: ArtilleryShell[];
  laserBeams: {
    x: number;
    y: number;
    frame: 0 | 1;
    frameCounter: number;
  }[];
  laserBurstRemaining: number;
  laserBurstCooldown: number;
  burstRemaining: number;
  burstCooldown: number;

  // visual effects
  puffs: Puff[];
  sparkEffects: SparkEffect[];
  bulletHoles: { x: number; y: number; age: number; maxAge: number }[];
  floatingScores: {
    x: number;
    y: number;
    vy: number;
    age: number;
    maxAge: number;
    amount: number;
  }[];
  falling: { x: number; y: number; vy: number; img: HTMLImageElement }[];

  // power‐up timers & flags
  activePowerups: Record<PowerupType, { expires: number }>;
  shieldFlash: number;
  screenShake: number;
  thunderCooldown: number;

  // animation state
  planeFrame: number;
  planeFrameCounter: number;
  groundIndex: number;
  planeAngle: number;
  smokeSpawned: boolean;
  groundContactFrames: number; // frames since last ground contact

  // crash flags
  crashed: boolean;
  crashHandled: boolean;
  groundCrashPuffsLeft: number;

  whooshPlaying: boolean;
  artilleryPlaying: boolean;
  missileThrusterPlaying: boolean;

  // text & UI helpers
  textLabels: TextLabel[];
  streak: number;
  ouchFrames: number;
  ouchExplodeIdx: number;

  // (splash) timers — you may choose to drop these once splash logic moves out
  readyTimeout: number;
  goTimeout: number;
  beepTimeouts: number[];

  isActive: (t: PowerupType, frameCount: number) => boolean;
  enemySpeed: (frameCount: number) => number;
  groundSpeed: (frameCount: number) => number;
}

export interface GameUIState {
  score: number;
  medalCount: number;
  duckCount: number;
  enemyCount: number;
  ammo: number;
  crashed: boolean;
  frameCount: number;
  activePowerups: Record<PowerupType, { expires: number }>;
  cursor: string;
  countdown: number | null;
  phase: GamePhase;
}
