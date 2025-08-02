import type { Dims, TextLabel } from "@/types/ui";

// Game phases for the simple zombiefish prototype
export type GamePhase = "title" | "playing" | "gameover";

// Basic fish state tracked by the engine
export interface Fish {
  id: number;
  kind: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Health points, used by skeleton fish. */
  health?: number;
  /**
   * Optional identifier tying fish together when spawned in a group.
   * Special fish spawn without a groupId.
   */
  groupId?: number;
  /** Whether this fish has turned into a skeleton */
  isSkeleton?: boolean;
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
}

// Internal game state tracked by the engine
export interface GameState extends GameUIState {
  dims: Dims;
  /** Active fish currently in the scene */
  fish: Fish[];
  /** Floating text labels currently displayed */
  textLabels: TextLabel[];
}
