import type { AssetMgr } from "@/types/ui";

// Draw a wavy layered seabed with sprinkled objects
export function drawRandomTerrainBackground(
  ctx: CanvasRenderingContext2D,
  getImg: AssetMgr["getImg"],
  width: number,
  height: number,
  seed = 0
) {
  // ---- seeded pseudo random ----
  const rand = (() => {
    let s = width * 1_000 + height * 7 + seed * 13;
    return () => {
      const x = Math.sin(s++) * 10_000;
      return x - Math.floor(x);
    };
  })();

  // ---- helpers ----
  const collect = (rec?: Record<string, HTMLImageElement>, filter?: (k: string) => boolean) =>
    rec
      ? Object.entries(rec)
          .filter(([k]) => !k.endsWith("_outline") && (!filter || filter(k)))
          .map(([, img]) => img)
      : [];

  // terrain image sets
  const waterImgs = getImg("terrainWaterImgs") as Record<string, HTMLImageElement> | undefined;
  const sandImgs = getImg("terrainSandImgs") as Record<string, HTMLImageElement> | undefined;
  const dirtImgs = getImg("terrainDirtImgs") as Record<string, HTMLImageElement> | undefined;
  const rockImgs = getImg("terrainRockImgs") as Record<string, HTMLImageElement> | undefined;

  const waterBase = waterImgs?.water_terrain;
  const waterTop = waterImgs?.water_terrain_top || waterBase;
  const tileW = waterBase?.width || waterTop?.width || 128;
  const tileH = waterBase?.height || waterTop?.height || 128;
  const cols = Math.ceil(width / tileW);

  const sandBaseTiles = collect(sandImgs, (k) => !k.includes("_top"));
  const sandTopTiles = collect(sandImgs, (k) => k.includes("_top"));
  const dirtBaseTiles = [
    ...collect(dirtImgs, (k) => !k.includes("_top")),
    ...collect(rockImgs, (k) => !k.includes("_top")),
  ];
  const dirtTopTiles = [
    ...collect(dirtImgs, (k) => k.includes("_top")),
    ...collect(rockImgs, (k) => k.includes("_top")),
  ];

  // precompute wavy boundaries
  const sandLine: number[] = [];
  const dirtLine: number[] = [];
  const sandBase = height * 0.65;
  const sandAmp = tileH * 0.4;
  const dirtAmp = tileH * 0.3;
  const sandPhase = rand() * Math.PI * 2;
  const dirtPhase = rand() * Math.PI * 2;
  for (let c = 0; c < cols; c++) {
    const x = c * 0.5;
    const s = sandBase + Math.sin(x + sandPhase) * sandAmp;
    const d = s + tileH * 2 + Math.sin(x * 0.8 + dirtPhase) * dirtAmp;
    sandLine.push(s);
    dirtLine.push(d);
  }

  // ---- draw water ----
  if (waterBase) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileW;
      const waterHeight = sandLine[c];
      let stack = Math.ceil(waterHeight / tileH);
      if (stack % 2 === 1) stack += 1; // even stack
      for (let i = 0; i < stack - 1; i++) {
        ctx.drawImage(waterBase, x, i * tileH, tileW, tileH);
      }
      ctx.drawImage(waterTop, x, (stack - 1) * tileH, tileW, tileH);
    }
  } else {
    ctx.fillStyle = "#1d8fde";
    ctx.fillRect(0, 0, width, height);
  }

  // ---- draw base terrain layers (dirt then sand) ----
  const topQueue: { img: HTMLImageElement; x: number; y: number }[] = [];
  for (let c = 0; c < cols; c++) {
    const x = c * tileW;
    const sY = sandLine[c];
    const dY = Math.min(dirtLine[c], height - tileH);

    // dirt base
    for (let y = dY; y < height; y += tileH) {
      const img = dirtBaseTiles[Math.floor(rand() * dirtBaseTiles.length)];
      if (img) ctx.drawImage(img, x, y, tileW, tileH);
    }
    const dirtTopImg = dirtTopTiles[Math.floor(rand() * dirtTopTiles.length)];
    if (dirtTopImg) topQueue.push({ img: dirtTopImg, x, y: dY - tileH });

    // sand base
    for (let y = sY; y < dY; y += tileH) {
      const img = sandBaseTiles[Math.floor(rand() * sandBaseTiles.length)];
      if (img) ctx.drawImage(img, x, y, tileW, tileH);
    }
    const sandTopImg = sandTopTiles[Math.floor(rand() * sandTopTiles.length)];
    if (sandTopImg) topQueue.push({ img: sandTopImg, x, y: sY - tileH });
  }

  // ---- sprinkle background objects ----
  const gather = (key: string) =>
    collect(getImg(key) as Record<string, HTMLImageElement> | undefined);
  const objectImgs: HTMLImageElement[] = [
    ...gather("seaweedImgs"),
    ...gather("seaGrassImgs"),
    ...gather("coralImgs"),
    ...gather("rockImgs"),
  ];
  const placements: number[] = [];
  const minDist = tileW * 0.8;
  const objCount = Math.min(objectImgs.length, Math.floor(width / (tileW * 1.5)));
  for (let i = 0; i < objCount; i++) {
    let x: number | null = null;
    for (let attempts = 0; attempts < 20; attempts++) {
      const cand = rand() * width;
      if (placements.every((p) => Math.abs(p - cand) > minDist)) {
        x = cand;
        break;
      }
    }
    if (x === null) continue;
    placements.push(x);
    const img = objectImgs[Math.floor(rand() * objectImgs.length)];
    const col = Math.min(Math.floor(x / tileW), cols - 1);
    const ground = rand() < 0.3 ? dirtLine[col] : sandLine[col];
    const scale = 0.5 + rand() * 0.7;
    const flip = rand() < 0.5 ? -1 : 1;
    const bury = rand() * (img?.height || 0) * 0.3;
    ctx.save();
    ctx.translate(x, ground);
    ctx.scale(flip * scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height + bury);
    ctx.restore();
  }

  // ---- draw top tiles to cover buried objects ----
  topQueue.sort((a, b) => b.y - a.y); // draw from bottom to top
  topQueue.forEach((t) => ctx.drawImage(t.img, t.x, t.y, tileW, tileH));
}

export default drawRandomTerrainBackground;
