export const PLANE_BASE_W = 60;
export const PLANE_BASE_H = 45;
export const PLANE_SCALE = 2.25;
export const PLANE_WIDTH = PLANE_BASE_W * PLANE_SCALE;
export const PLANE_HEIGHT = PLANE_BASE_H * PLANE_SCALE;

export const ENEMY_WIDTH = PLANE_WIDTH;
export const ENEMY_HEIGHT = PLANE_HEIGHT;
export const ENEMY_COLORS = [
    "/assets/tappyplane/PNG/Planes/planeBlue1.png",
    "/assets/tappyplane/PNG/Planes/planeGreen1.png",
    "/assets/tappyplane/PNG/Planes/planeRed1.png",
  ];

export const AIRSHIP_COLORS = ["green", "red"] as const;
export const AIRSHIP_MIN_ALT = 0.1; // 10% down from top
export const AIRSHIP_MAX_ALT = 0.2; // 20% down
export const AIRSHIP_MIN_SPEED = 1; // px per frame
export const AIRSHIP_MAX_SPEED = 3; // px per frame
export const AIRSHIP_SPAWN_PROB = 0.0005; // ~1 in 2,000 frames
export const AIRSHIP_BOB_AMPLITUDE = 80; // px
export const AIRSHIP_BOB_FREQUENCY = 0.05; // radians per frame
export const AIRSHIP_SIZE = 164;

