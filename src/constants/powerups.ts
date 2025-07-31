import {
  AntiPowerupType,
  SuperPowerupType,
  PowerupType,
} from "@/types/objects";

/** All powerup types available in the game */
export const POWERUP_TYPES: PowerupType[] = [
  "artillery",
  "bomb",
  "coin2x",
  "ducksight",
  "freeze",
  "ghost",
  "homing",
  "hourglass",
  "infiniteAmmo",
  "machineGuns",
  "autoReload",
  "megaducks",
  "napalm",
  "magnet",
  "shield",
  "supershield",
  "shrink",
  "skull",
  "gunjam",
  "sticky",
  "heavy",
  "spray",
  "supermag",
  "laserbeam",
  "thunderstrike",
  "windy",
  "turbulence",
  "blindfold",
  "wings",
];

/** Powerup types that provide various disadvantages */
export const ANTI_POWERUP_TYPES: AntiPowerupType[] = [
  "skull",
  "gunjam",
  "sticky",
  "heavy",
  "windy",
  "turbulence",
  "blindfold",
];

/** High power, rare powerups that provide significant advantages */
export const SUPER_POWERUP_TYPES: SuperPowerupType[] = [
  "artillery",
  "freeze",
  "supermag",
  "megaducks",
  "napalm",
  "supershield",
  "laserbeam",
  "thunderstrike",
];

export const POWERUP_DURATION = 20 * 60; // 20s @60fps

// machine gun powerup related constants
export const SCORE_MACHINE_GUN_BONUS = 50;
export const MACHINE_GUN_BURST_COUNT = 5; // number of shots per burst
export const MACHINE_GUN_SHOT_INTERVAL = 5; // frames between shots in burst
export const CANNONBALL_SPEED = 12; // pixels per frame

// laser beam super powerup constants
export const LASER_BEAM_BURST_COUNT = 15; // number of beams per burst
export const LASER_BEAM_SHOT_INTERVAL = 2; // frames between beams in burst
export const LASER_BEAM_SPEED = 20; // pixels per frame

// auto reload powerup constants
export const AUTO_RELOAD_INTERVAL = 15; // frames per ammo refill

// homing missile related constants
export const SCORE_HOMING_BONUS = 100;
export const HOMING_MISSILE_SIZE = 32; // size of the missile image
export const HOMING_MISSILE_SPAWN_RATE = 0.01; // chance per frame to spawn a missile
export const HOMING_MISSILE_SPEED = 6; // pixels per frame
// how long the missile will chase its target
export const HOMING_MISSILE_LIFETIME = 120; // frames

// napalm powerup related constants
export const NAPALM_MISSILE_SRC = "/assets/tanks/PNG/Retina/tank_bullet4.png";
export const NAPALM_SPAWN_INTERVAL = 0.005; // chance per frame to launch a napalm missile
export const NAPALM_DROP_INTERVAL = 20;
export const NAPALM_MISSILE_SIZE = 64; // px
export const NAPALM_MISSILE_SPEED = 4; // px/frame
export const NAPALM_DROP_MIN = 6;
export const NAPALM_DROP_MAX = 9;
export const NAPALM_ALTITUDE_MIN = 0.1; // 10% down from top
export const NAPALM_ALTITUDE_MAX = 0.3; // 30% down from top
export const NAPALM_TILE_SIZE = 72;
export const NAPALM_FLAME_LENGTH = 20;
export const NAPALM_BURN_DURATION = 10 * 60; // 10s @60fps
export const NAPALM_EXPLODE_NOT_DROP = true;
export const NAPALM_BEGIN_EXPLODE_X = 400; // minimum x-position before explosion
export const NAPALM_END_EXPLODE_X = 1000;
export const NAPALM_EXPLODE_RADIUS = 200;

export const NAPALM_FLAME_FRAME_SRCS = [
  "/assets/flame/flame_frame_1.png",
  "/assets/flame/flame_frame_2.png",
  "/assets/flame/flame_frame_3.png",
  "/assets/flame/flame_frame_4.png",
];

// artillery powerup related constants
export const ARTILLERY_RATE = 0.02; // chance per frame to spawn a shell
export const ARTILLERY_SHELL_SIZE = 32; // px
export const ARTILLERY_SHELL_SPEED_MIN = 8; // px/frame
export const ARTILLERY_SHELL_SPEED_MAX = 12; // px/frame
export const SCORE_ARTILLERY_BONUS = 200; // extra bonus per hit

// spray powerup related constants
export const SPRAY_COUNT = 5; // how many bullets per click
export const SPRAY_SPREAD = 40; // max pixel offset left/right/up/down
export const SPRAY_INTERVAL = 50; // ms between each pellet
export const SPRAY_DECREMENTS_AMMO = false; // whether spray powerup decrements ammo

// megaducks powerup related constants
export const DUCK_MAGNIFY_SCALE = 3.0;
// constants for ducksight powerup
export const DUCKSIGHT_MAGNIFY_SCALE = 1.33;

// how far to randomly jostle each plane per frame
export const SCRAMBLE_INTENSITY = 8; // pixels
