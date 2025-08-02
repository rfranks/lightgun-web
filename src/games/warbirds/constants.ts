import { PowerupType } from "@/types/objects";
import { BASE_PATH } from "@/utils/basePath";

// ─── DEBUG FLAGS ─────────────────────────────────────────────────────────
export const DEBUG_PLAYER_CRASH = false; // when true, player never actually “dies”
export const TEST_SLOW_FALL = false;
export const POWERUP_DEBUG = [] as PowerupType[]; // force a specific powerup type, or leave empty for random

export const ENABLE_AUTO_FLAP = true; // auto‐flap toggle: when true, player will flap randomly
export const AUTO_FLAP_PROB = 0.025;

// Constants
export const FLAP_STRENGTH = -8;
export const PLANE_OFFSET_X = 100;
export const MAX_AMMO = 12;

export const GROUND_SPEED = 2;
export const SMOKE_TRAIL_COUNT = 5;
export const SKY_COLOR = "#6CA6CD";
export const CLICK_RADIUS_MULTIPLIER = 2;

export const INITIAL_ENEMY_DENSITY = 0.01; // easier start
export const ENEMY_DENSITY_STEP = 0.005;
export const ENEMY_SPEED = 5; // horizontal speed of enemy planes
export const ENEMY_FLAP_INTERVAL = 60; // frames between auto-flaps
export const ENEMY_FLAP_BASE = 8; // base flap strength
export const ENEMY_FLAP_RANDOM = 4; // plus up to this extra
export const ENEMY_CAN_FLAP = false; // whether enemies can flap
export const ENEMY_GLIDE_PROB = 0.3; // chance an enemy is a glider (constant altitude)

// loop-de-loop config for gliders
export const ENEMY_LOOP_PROB = 0.001; // per-frame chance to start a loop
export const ENEMY_LOOP_DURATION = 180; // frames to complete 1 loop
export const ENEMY_LOOP_RADIUS = 100; // vertical radius of loop

// non-loop glide altitude steps
export const ENEMY_STEP_PROB = 0.005; // per-frame chance to start a small altitude shift
export const ENEMY_STEP_DURATION = 60; // frames over which to perform the shift
export const ENEMY_MAX_STEP = 150; // max vertical shift for a step

// how often a dropped medal appears when you shoot an enemy
export const ENEMY_MEDAL_SPAWN_PROB = 0.3;

// point value of shooting a medal
export const MEDAL_SCORE = 500;
// size at which we'll draw each medal
export const MEDAL_SIZE = 64;

// ─── SCORE CONFIG ─────────────────────────────────────────────────────────
export const SCORE_FLAP = 50;
export const SCORE_HIT = 100;
export const SCORE_RELOAD = 25;
export const SCORE_DUCK = 1000;

export const MIN_STREAK = 3; // minimum streak to show label

// Cursor styles
export let DEFAULT_CURSOR =
  `url('${BASE_PATH}/assets/shooting-gallery/PNG/HUD/crosshair_red_small.png') 16 16, auto`;
export let SHOT_CURSOR =
  `url('${BASE_PATH}/assets/shooting-gallery/PNG/Objects/shot_brown_large.png') 16 16, auto`;

export const setCursorImgs = (cursorSrc: string, shotSrc: string) => {
  DEFAULT_CURSOR = `url('${cursorSrc}') 16 16, auto`;
  SHOT_CURSOR = `url('${shotSrc}') 16 16, auto`;
};
