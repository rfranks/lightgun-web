/**
 * Game-wide constants for the Zombiefish game.
 */

// Spawn interval for fish in frames (assuming 60 FPS).
export const FISH_SPAWN_INTERVAL_MIN = 60; // 1 second
export const FISH_SPAWN_INTERVAL_MAX = 180; // up to 3 seconds

// Horizontal speed range for fish in pixels per frame.
export const FISH_SPEED_MIN = 1;
export const FISH_SPEED_MAX = 3;

// Speed at which skeleton fish chase others.
export const SKELETON_SPEED = 2;

// Time adjustments when hitting special fish (in seconds).
export const TIME_BONUS_BROWN_FISH = 3;
export const TIME_PENALTY_GREY_LONG = 5;

