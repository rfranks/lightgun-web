import { Cloud, Mountain, Tree, Water } from "@/types/environment";

export function randomCloud(
  canvasWidth: number,
  canvasHeight: number,
  whitePuffImgs: HTMLImageElement[],
  groundSpeed: () => number
): Cloud {
  const count = 3 + Math.floor(Math.random() * 3); // 3–5 puffs
  const y = 50 + Math.random() * (canvasHeight * 0.1);
  const puffs = [];
  for (let i = 0; i < count; i++) {
    const img = whitePuffImgs[Math.floor(Math.random() * whitePuffImgs.length)];
    const dx = (Math.random() - 0.5) * 200;
    const dy = (Math.random() - 0.5) * 50;
    const scale = 1.0 + Math.random() * 0.5;
    puffs.push({ img, dx, dy, scale });
  }
  return {
    x: canvasWidth + 100,
    y,
    vx: -1.0 * groundSpeed() * 0.3,
    puffs,
  };
}

// Helper for mountains
export function randomMountain(
  canvasWidth: number,
  canvasHeight: number,
  rockImgs: HTMLImageElement[],
  groundSpeed: () => number,
  MOUNTAIN_SCALE_MIN: number,
  MOUNTAIN_SCALE_MAX: number
): Mountain {
  const img = rockImgs[Math.floor(Math.random() * rockImgs.length)];
  const baseScale =
    MOUNTAIN_SCALE_MIN +
    Math.random() * (MOUNTAIN_SCALE_MAX - MOUNTAIN_SCALE_MIN);

  const sx = baseScale * (0.8 + Math.random() * 0.4) * 3;
  const sy = baseScale * 2;
  const w = img.width * sx;
  const h = img.height * sy;
  const y = canvasHeight - 50 - h;

  return {
    x: canvasWidth + Math.random() * 200,
    y,
    vx: -1 * groundSpeed() * 0.2,
    img,
    width: w,
    height: h,
    scaleX: sx,
    scaleY: sy,
  };
}

// Helper for ranges
export function randomMountainRange(
  canvasWidth: number,
  canvasHeight: number,
  rockImgs: HTMLImageElement[],
  groundSpeed: () => number,
  MOUNTAIN_SCALE_MIN: number,
  MOUNTAIN_SCALE_MAX: number
): Mountain[] {
  const count = 3 + Math.floor(Math.random() * 3);
  const startX = canvasWidth + Math.random() * 300;
  const spacing = 200 + Math.random() * 100;
  return Array.from({ length: count }).map((_, i) => {
    const m = randomMountain(
      canvasWidth,
      canvasHeight,
      rockImgs,
      groundSpeed,
      MOUNTAIN_SCALE_MIN,
      MOUNTAIN_SCALE_MAX
    );
    m.x = startX + i * spacing * (0.8 + Math.random() * 0.4);
    return m;
  }) as Mountain[];
}

// Trees
export function randomTree(
  canvasWidth: number,
  canvasHeight: number,
  treeImgs: HTMLImageElement[],
  groundSpeed: () => number,
  forcedScale?: number
): Tree {
  const img = treeImgs[Math.floor(Math.random() * treeImgs.length)];
  const scale = forcedScale ?? 0.5 + Math.random();
  const w = img.width * scale;
  const h = img.height * scale;
  const x = canvasWidth + Math.random() * 200;
  const y = canvasHeight - 50 - h;
  return {
    x,
    y: y + 40,
    vx: -1.0 * groundSpeed() * 0.2,
    img,
    width: w,
    height: h,
    scaleX: scale,
    scaleY: scale,
  };
}

// Water
export function randomWater(
  canvasWidth: number,
  groundY: number,
  WATER_MIN_SIZE: number,
  WATER_MAX_SIZE: number,
  size?: number
): Water {
  const lakeSize =
    size ??
    WATER_MIN_SIZE +
      Math.floor(Math.random() * (WATER_MAX_SIZE - WATER_MIN_SIZE + 1));
  return {
    x: canvasWidth + Math.random() * 200,
    y: groundY - 32,
    size: lakeSize,
    frameIndex: 0,
    frameCounter: 0,
    frameRate: 30,
  };
}
