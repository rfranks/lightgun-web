import { BASE_PATH } from "@/utils/basePath";

/**
 * Game-wide constants for the Zombiefish game.
 */

// Cursor styles
export const DEFAULT_CURSOR =
  `url('${BASE_PATH}/assets/shooting-gallery/PNG/HUD/crosshair_blue_small.png') 16 16, auto`;
export const SHOT_CURSOR =
  `url('${BASE_PATH}/assets/shooting-gallery/PNG/HUD/crosshair_white_small.png') 16 16, auto`;
export const TARGET_CURSOR =
  `url('${BASE_PATH}/assets/shooting-gallery/PNG/HUD/crosshair_red_small.png') 16 16, auto`;

// Background color representing the underwater environment
export const SKY_COLOR = "#1d8fde";

// Spawn interval for fish in frames (assuming 60 FPS).
export const FISH_SPAWN_INTERVAL_MIN = 60; // 1 second
export const FISH_SPAWN_INTERVAL_MAX = 180; // up to 3 seconds

// Horizontal speed range for fish in pixels per frame.
export const FISH_SPEED_MIN = 1;
export const FISH_SPEED_MAX = 3;

// Speed at which skeleton fish chase others.
export const SKELETON_SPEED = 2;

// Maximum number of skeleton fish allowed simultaneously.
// Lowered to reduce overall fish population on screen.
export const MAX_SKELETONS = 20;

// Maximum number of basic fish allowed simultaneously.
export const MAX_FISH = 30;

// Maximum number of special fish (brown, grey long, etc.) allowed at once.
export const MAX_SPECIAL_FISH = 3;

// Time adjustments when hitting special fish (in seconds).
export const TIME_BONUS_BROWN_FISH = 3;
export const TIME_BONUS_GREY_LONG = 5;

