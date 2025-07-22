/**
 * The default acceleration due to gravity in the game world.
 *
 * Used as the baseline for all gravity-based physics interactions in every game mode.
 * Tune per-game in game-specific constants if needed.
 */
export const GRAVITY = 0.3;

export const MOUNTAIN_SCALE_MIN = 1;
export const MOUNTAIN_SCALE_MAX = 2;

export const GROUND_VARIANTS = [
  "/assets/tappyplane/PNG/groundDirt.png",
  "/assets/tappyplane/PNG/groundGrass.png",
  "/assets/tappyplane/PNG/groundIce.png",
  "/assets/tappyplane/PNG/groundRock.png",
  "/assets/tappyplane/PNG/groundSnow.png",
];

// Tree assets
export const TREE_SOURCES = [
  "/assets/shooting-gallery/PNG/Stall/tree_oak.png",
  "/assets/shooting-gallery/PNG/Stall/tree_pine.png",
];

export const WATER_SRCS = [
  "/assets/shooting-gallery/PNG/Stall/water1.png",
  "/assets/shooting-gallery/PNG/Stall/water2.png",
];
// you can tweak these
export const WATER_MIN_SIZE = 3;
export const WATER_MAX_SIZE = 7;
export const WATER_SPAWN_PROB = 0.002;

export const ROCK_SRCS = [
  "/assets/tappyplane/PNG/rock.png",
  "/assets/tappyplane/PNG/rockGrass.png",
  "/assets/tappyplane/PNG/rockIce.png",
  "/assets/tappyplane/PNG/rockSnow.png",
];
