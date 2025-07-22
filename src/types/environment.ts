/**
 * Represents a background mountain object.
 */
export interface Mountain {
  /** Horizontal position (pixels) */
  x: number;
  /** Vertical position (pixels) */
  y: number;
  /** Horizontal velocity (pixels/frame) */
  vx: number;
  /** Image asset for the mountain */
  img: HTMLImageElement;
  /** Drawn width (pixels) */
  width: number;
  /** Drawn height (pixels) */
  height: number;
  /** X-axis scale factor */
  scaleX: number;
  /** Y-axis scale factor */
  scaleY: number;
}

/**
 * Represents a tree object in the game world.
 */
export interface Tree {
  x: number;
  y: number;
  vx: number;
  img: HTMLImageElement;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

/**
 * Represents a lake or body of water.
 */
export interface Water {
  x: number;
  y: number;
  /** Number of water tiles horizontally */
  size: number;
  /** Animation frame index (toggle for animated water) */
  frameIndex: 0 | 1;
  /** Frames elapsed for animation timing */
  frameCounter: number;
  /** How many frames to wait before switching animation frame */
  frameRate: number;
}

/**
 * Represents a cloud made up of several puffs.
 */
export interface Cloud {
  x: number;
  y: number;
  vx: number;
  /** Sub-puffs composing the cloud */
  puffs: {
    img: HTMLImageElement;
    dx: number;
    dy: number;
    scale: number;
  }[];
}
