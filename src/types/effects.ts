/**
 * A generic smoke or explosion puff.
 */
export interface Puff {
  x: number;
  y: number;
  /** Vertical velocity for rising/falling effects */
  vy: number;
  img: HTMLImageElement;
  /** Current age in frames */
  age: number;
  /** Max age before disappearing */
  maxAge: number;
  /** Optional: drawn size override */
  size?: number;
}

/**
 * Represents a spark or electric arc effect (e.g., thunderstrike).
 */
export interface SparkEffect {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  frameIndex: number;
}

/**
 * Generalized fire/burn area (derived from NapalmTile).
 */
export interface Fire {
  x: number;
  y: number;
  /** Vertical movement, if any (e.g., falling, rising) */
  vy: number;
  /** Frames left to burn */
  life: number;
  /** Max lifetime for fade/animation */
  maxLife: number;
  /** If true, fire kills the player on contact */
  killsPlayer: boolean;
}
