/**
 * Represents an enemy airplane.
 */
export interface Enemy {
  x: number;
  y: number;
  vy: number;
  flapStrength: number;
  /** Array of animation frames */
  frames: HTMLImageElement[];
  propFrame: number;
  frameRate: number;
  frameCounter: number;
  alive: boolean;
  glide: boolean;
  /** Looping progress: -1 = not looping, [0..duration] = looping */
  loopProgress: number;
  /** Center Y for looping */
  baseY: number;
  /** Draw rotation in radians */
  rotation?: number;
  /** Progress for vertical step maneuver */
  stepProgress: number;
  stepDelta: number;
  hasStick: boolean;
  stickBroken: boolean;
  stickImg: HTMLImageElement;
  brokenStickImg: HTMLImageElement;
  targetImg: HTMLImageElement;
  /** Target visual type */
  targetType: "red1" | "red2" | "red3";
  /** Score for hitting the target */
  targetScore: number;
  /** Fade-out for hit target */
  targetFadeAge: number;
  targetFadeMax: number;
  targetHit: boolean;
  /** Target vertical velocity when falling */
  targetVy: number;
}

/**
 * Alias for a plane controlled by the player.
 */
export type Plane = Enemy;

/**
 * Represents a special airship (bonus, powerup dropper).
 */
export interface Airship {
  x: number;
  baseY: number;
  frames: HTMLImageElement[];
  frameIndex: number;
  frameCounter: number;
  frameRate: number;
  speed: number;
  color: AirshipColor;
  /** Used for vertical bobbing offset */
  bobOffset: number;
}

/**
 * Possible airship colors.
 */
export type AirshipColor = "green" | "red";
