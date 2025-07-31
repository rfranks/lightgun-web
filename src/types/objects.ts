/**
 * All supported powerup types.
 */
export type PowerupType =
  | "artillery"
  | "bomb"
  | "coin2x"
  | "ducksight"
  | "freeze"
  | "ghost"
  | "homing"
  | "hourglass"
  | "infiniteAmmo"
  | "machineGuns"
  | "autoReload"
  | "megaducks"
  | "napalm"
  | "magnet"
  | "shield"
  | "supershield"
  | "shrink"
  | "skull"
  | "gunjam"
  | "sticky"
  | "heavy"
  | "blindfold"
  | "spray"
  | "supermag"
  | "laserbeam"
  | "thunderstrike"
  | "windy"
  | "turbulence"
  | "wings";

/**
 * Types of anti-powerups (negative effects).
 */
export type AntiPowerupType =
  | "skull"
  | "gunjam"
  | "sticky"
  | "heavy"
  | "windy"
  | "turbulence"
  | "blindfold";

/**
 * Extra-strong, rare powerup types.
 */
export type SuperPowerupType =
  | "freeze"
  | "supermag"
  | "megaducks"
  | "napalm"
  | "supershield"
  | "artillery"
  | "laserbeam"
  | "thunderstrike";

/**
 * A floating powerup item on the map.
 */
export interface Powerup {
  x: number;
  y: number;
  img: HTMLImageElement;
  type: PowerupType;
  /** True if player has collected this powerup */
  collected?: boolean;
}

/**
 * Represents a spinning collectible medal.
 */
export interface Medal {
  x: number;
  y: number;
  /** Horizontal velocity (pixels/frame) */
  vx: number;
  /** Animation frames for medal spin */
  frames: HTMLImageElement[];
  frameIndex: number;
  frameCounter: number;
  frameRate: number;
  /** Medal ID (1–9) */
  id: number;
}

/**
 * Represents a duck (target in bonus game).
 */
export interface Duck {
  x: number;
  y: number;
  img: HTMLImageElement;
  /** Outline image for 'ducksight' effect */
  outlineImg: HTMLImageElement;
  /** Image to show when duck is shot */
  targetImg: HTMLImageElement;
  width: number;
  height: number;
  /** True if hit/shot */
  hit?: boolean;
  fadeAge?: number;
  fadeMax?: number;
  /** Sprite index (color/type) */
  srcIdx: number;
  /** Animation phase for swimming bob */
  bobPhase: number;
  /** Horizontal swim velocity */
  vx: number;
  /** Direction (1=right, -1=left) */
  dir: 1 | -1;
  /** Reference to the water/lake this duck belongs to */
  waterRef: import("./environment").Water;
}
