import type { Dims, TextLabel } from "@/types/ui";

// Game phases for the simple zombiefish prototype
export type GamePhase = "title" | "playing" | "paused" | "gameover";

// Basic fish state tracked by the engine
export interface Fish {
  id: number;
  kind: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Current drawing angle in radians based on velocity. */
  angle: number;
  /** Current animation frame index */
  frame: number;
  /** Counter used to time frame changes */
  frameCounter: number;
  /** Health points, used by skeleton fish. */
  health: number;
  /** Frames remaining for the red flash after taking damage. */
  hurtTimer: number;
  /**
   * Optional identifier tying fish together when spawned in a group.
   * Special fish spawn without a groupId.
   */
  groupId?: number;
  /** Identifier used to link special multi-segment fish pieces together. */
  pairId?: number;
  /** Whether this fish should draw with a highlighted variant */
  highlight?: boolean;
  /** Whether this fish has turned into a skeleton */
  isSkeleton?: boolean;
  /** Frames remaining for a conversion flash effect */
  flashTimer?: number;
  /** Whether this fish is awaiting skeleton conversion */
  pendingSkeleton?: boolean;
}

// Rising bubble drifting upward in the background
export interface Bubble {
  id: number;
  /** Which bubble sprite to draw */
  kind: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Rendered size in pixels */
  size: number;
  /** Horizontal wiggle amplitude */
  amp: number;
  /** Horizontal wiggle frequency */
  freq: number;
}

// Expanding ring drawn when a shot misses
export interface MissParticle {
  x: number;
  y: number;
  /** Current radius of the ring */
  radius: number;
  /** Current opacity from 1 to 0 */
  alpha: number;
}

// State exposed to the UI layer
export interface GameUIState {
  phase: GamePhase;
  /** Remaining time in seconds */
  timer: number;
  /** Total number of shots fired */
  shots: number;
  /** Total number of successful hits */
  hits: number;
  /** Hit accuracy percentage */
  accuracy: number;
  /** Current cursor style */
  cursor: string;
}

// Internal game state tracked by the engine
export interface GameState extends GameUIState {
  dims: Dims;
  /** Active fish currently in the scene */
  fish: Fish[];
  /** Bubbles floating up behind the fish */
  bubbles: Bubble[];
  /** Floating text labels currently displayed */
  textLabels: TextLabel[];
  /** Ring particles displayed when shots miss */
  missParticles: MissParticle[];
  /** Total number of fish converted into skeletons */
  conversions: number;
  /** Hit counts grouped by fish type */
  hitCounts: Record<string, number>;
}
