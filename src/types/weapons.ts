/**
 * Represents an artillery shell projectile.
 */
export interface ArtilleryShell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  img: HTMLImageElement;
}

/**
 * Homing missile with optional target (duck or enemy).
 */
export interface HomingMissile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  img: HTMLImageElement;
  /** Animation frame for tail flame (0 or 1) */
  tailFrame: 0 | 1;
  tailCounter: number;
  /** Remaining life in frames */
  life: number;
  /** Target, if any (duck or enemy) */
  target?: import("./vehicles").Enemy | import("./objects").Duck;
}

/**
 * Represents a napalm bomb/missile projectile.
 */
export interface NapalmMissile {
  x: number;
  y: number;
  vx: number;
  /** Frames remaining before detonation */
  life: number;
  /** How many napalm tiles remain to be dropped */
  dropsRemaining: number;
  /** Counter until next drop */
  dropTimer: number;
  img: HTMLImageElement;
  tailFrame: 0 | 1;
  tailCounter: number;
  /** X position to trigger explosion effect */
  explodeX: number;
}

/**
 * Alias for fire tile effect (formerly NapalmTile).
 */
export type NapalmTile = import("./effects").Fire;
