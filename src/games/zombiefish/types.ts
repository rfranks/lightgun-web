import type { Dims } from "@/types/ui";

// Game phases for the simple zombiefish prototype
export type GamePhase = "title" | "playing" | "gameover";

// State exposed to the UI layer
export interface GameUIState {
  phase: GamePhase;
  /** Remaining time in frames */
  timer: number;
  /** Total number of shots fired */
  shots: number;
  /** Total number of successful hits */
  hits: number;
}

// Internal game state tracked by the engine
export interface GameState extends GameUIState {
  dims: Dims;
}
