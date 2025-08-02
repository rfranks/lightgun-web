"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { AssetMgr } from "@/types/ui";
import { withBasePath } from "@/utils/basePath";

/**
 * Asset loading hook for the Zombiefish game.
 * Mirrors warbirds' useGameAssets to keep API consistent across games.
 */
export function useGameAssets(): {
  get: AssetMgr["get"];
  getImg: AssetMgr["getImg"];
  assetRefs: AssetMgr["assetRefs"];
  ready: boolean;
} {
  const [ready, setReady] = useState(false);
  const assetRefs = useRef<AssetMgr["assetRefs"]>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadImg = (src: string) => {
      const img = new window.Image();
      img.src = withBasePath(src);
      return img;
    };

    const build = (folder: string, names: string[]) =>
      Object.fromEntries(
        names.map((name) => [
          name,
          loadImg(`/assets/fish/PNG/${folder}/${name}.png`),
        ])
      );

    // FISH FRAMES FROM SPRITESHEET
    const sheet = loadImg("/assets/fish/Spritesheet/spritesheet.png");
    const FISH_SIZE = 128;
    const fishCoords: Record<string, [number, number][]> = {
      blue: [[1152, 256]],
      brown: [[1024, 1280]],
      green: [[1024, 1024]],
      grey: [[1024, 512]],
      grey_long_a: [[1024, 384]],
      grey_long_b: [[1024, 128]],
      orange: [[896, 1280]],
      pink: [[896, 768]],
      red: [[896, 256]],
    };
    const skeletonCoords: Record<string, [number, number][]> = {
      blue: [[1152, 0]],
      green: [[1024, 768]],
      orange: [[896, 1024]],
      pink: [[896, 512]],
      red: [[896, 0]],
    };

    sheet.onload = () => {
      const makeFrames = (coords: Record<string, [number, number][]>) =>
        Object.fromEntries(
          Object.entries(coords).map(([kind, arr]) => [
            kind,
            arr.map(([sx, sy]) => {
              const canvas = document.createElement("canvas");
              canvas.width = FISH_SIZE;
              canvas.height = FISH_SIZE;
              const ctx = canvas.getContext("2d");
              ctx?.drawImage(
                sheet,
                sx,
                sy,
                FISH_SIZE,
                FISH_SIZE,
                0,
                0,
                FISH_SIZE,
                FISH_SIZE
              );
              const img = new window.Image();
              img.src = canvas.toDataURL();
              return img;
            }),
          ])
        );

      assetRefs.current.fishFrames = makeFrames(fishCoords);
      assetRefs.current.skeletonFrames = makeFrames(skeletonCoords);
      setReady(true);
    };

    // FISH IMAGES
    const fishTypes = [
      "blue",
      "brown",
      "brown_outline",
      "green",
      "grey",
      "grey_long_a",
      "grey_long_a_outline",
      "grey_long_b",
      "grey_long_b_outline",
      "orange",
      "pink",
      "red",
    ];
    assetRefs.current.fishImgs = Object.fromEntries(
      fishTypes.map((name) => [
        name,
        loadImg(`/assets/fish/PNG/Objects/Fish/fish_${name}.png`),
      ])
    );

    // FLASH OVERLAY
    assetRefs.current.fishFlashImg = loadImg(
      "/assets/smoke/PNG/Flash/flash00.png"
    );

    // OBJECTS
    assetRefs.current.bubbleImgs = build("Objects/Bubbles", [
      "bubble_a",
      "bubble_b",
      "bubble_c",
    ]);

    assetRefs.current.rockImgs = build("Objects/Rocks", [
      "background_rock_a",
      "background_rock_b",
      "rock_a",
      "rock_a_outline",
      "rock_b",
      "rock_b_outline",
    ]);
    assetRefs.current.rockBgImgs = [
      assetRefs.current.rockImgs.background_rock_a,
      assetRefs.current.rockImgs.background_rock_b,
    ];

    assetRefs.current.seaGrassImgs = build("Objects/SeaGrass", [
      "seaweed_grass_a",
      "seaweed_grass_a_outline",
      "seaweed_grass_b",
      "seaweed_grass_b_outline",
    ]);
    assetRefs.current.seaGrassFgImgs = [
      assetRefs.current.seaGrassImgs.seaweed_grass_a,
      assetRefs.current.seaGrassImgs.seaweed_grass_b,
    ];

    const seaweedNames: string[] = [];
    "abcdefgh".split("").forEach((l) => {
      seaweedNames.push(`background_seaweed_${l}`);
    });
    "abcd".split("").forEach((l) => {
      seaweedNames.push(`seaweed_green_${l}`);
      seaweedNames.push(`seaweed_green_${l}_outline`);
    });
    "ab".split("").forEach((l) => {
      seaweedNames.push(`seaweed_orange_${l}`);
      seaweedNames.push(`seaweed_orange_${l}_outline`);
    });
    "abcd".split("").forEach((l) => {
      seaweedNames.push(`seaweed_pink_${l}`);
      seaweedNames.push(`seaweed_pink_${l}_outline`);
    });
    assetRefs.current.seaweedImgs = build("Objects/Seaweed", seaweedNames);
    assetRefs.current.seaweedBgImgs = "abcdefgh"
      .split("")
      .map(
        (l) =>
          (assetRefs.current.seaweedImgs as Record<string, HTMLImageElement>)[
            `background_seaweed_${l}`
          ] || undefined
      );

    // TERRAIN
    const topLetters = "abcdefgh".split("");
    const dirtNames = [
      "terrain_dirt_a",
      "terrain_dirt_b",
      "terrain_dirt_c",
      "terrain_dirt_d",
      ...topLetters.flatMap((l) => [
        `terrain_dirt_top_${l}`,
        `terrain_dirt_top_${l}_outline`,
      ]),
    ];
    const sandNames = [
      "terrain_sand_a",
      "terrain_sand_b",
      "terrain_sand_c",
      "terrain_sand_d",
      ...topLetters.flatMap((l) => [
        `terrain_sand_top_${l}`,
        `terrain_sand_top_${l}_outline`,
      ]),
    ];

    const waterNames = ["water_terrain", "water_terrain_top"];
    assetRefs.current.terrainDirtImgs = build("Terrain/Dirt", dirtNames);
    assetRefs.current.terrainSandImgs = build("Terrain/Sand", sandNames);
    assetRefs.current.terrainWaterImgs = build("Terrain/Water", waterNames);

    // DIGIT IMAGES
    assetRefs.current.digitImgs = {};
    for (let n = 0; n <= 9; n++) {
      assetRefs.current.digitImgs[n.toString()] = loadImg(
        `/assets/fish/PNG/HUDText/hud_number_${n}.png`
      );
    }
    assetRefs.current.digitImgs[":"] = loadImg(
      "/assets/fish/PNG/HUDText/hud_colon.png"
    );

    // LETTER IMAGES
    assetRefs.current.letterImgs = {};
    for (let c = 65; c <= 90; c++) {
      const ch = String.fromCharCode(c);
      assetRefs.current.letterImgs[ch] = loadImg(
        `/assets/tappyplane/PNG/Letters/letter${ch}.png`
      );
    }

    assetRefs.current.dotImg = loadImg("/assets/fish/PNG/HUDText/hud_dot.png");
    assetRefs.current.pctImg = loadImg(
      "/assets/fish/PNG/HUDText/hud_percent.png"
    );
    assetRefs.current.plusImg = loadImg(
      "/assets/fish/PNG/HUDText/hud_plus.png"
    );

    // Generate a simple minus sign dynamically since assets lack one
    const minusCanvas = document.createElement("canvas");
    minusCanvas.width = assetRefs.current.plusImg.width || 32;
    minusCanvas.height = assetRefs.current.plusImg.height || 32;
    const mctx = minusCanvas.getContext("2d");
    if (mctx) {
      mctx.fillStyle = "white";
      const barHeight = Math.max(1, Math.floor(minusCanvas.height / 5));
      const y = Math.floor((minusCanvas.height - barHeight) / 2);
      mctx.fillRect(0, y, minusCanvas.width, barHeight);
    }
    const minusImg = new window.Image();
    minusImg.src = minusCanvas.toDataURL();
    assetRefs.current.minusImg = minusImg;
  }, []);

  const get = useCallback<AssetMgr["get"]>(
    (key: string) => assetRefs.current[key],
    []
  );
  const getImg = useCallback<AssetMgr["getImg"]>(
    (key: string) => assetRefs.current[key] ?? undefined,
    []
  );

  return { get, getImg, assetRefs: assetRefs.current, ready };
}
