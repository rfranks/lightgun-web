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

    // FISH IMAGES
    const fishTypes = [
      "blue",
      "brown",
      "green",
      "grey",
      "grey_long_a",
      "grey_long_b",
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

    // SKELETON IMAGES
    const skeletonTypes = ["blue", "green", "orange", "pink", "red"];
    assetRefs.current.skeletonImgs = Object.fromEntries(
      skeletonTypes.map((name) => [
        name,
        loadImg(`/assets/fish/PNG/Objects/Fish/fish_${name}_skeleton.png`),
      ])
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

    assetRefs.current.seaGrassImgs = build("Objects/SeaGrass", [
      "seaweed_grass_a",
      "seaweed_grass_a_outline",
      "seaweed_grass_b",
      "seaweed_grass_b_outline",
    ]);

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

    assetRefs.current.dotImg = loadImg("/assets/fish/PNG/HUDText/hud_dot.png");
    assetRefs.current.colonImg = loadImg(
      "/assets/fish/PNG/HUDText/hud_colon.png"
    );
    assetRefs.current.pctImg = loadImg(
      "/assets/fish/PNG/HUDText/hud_percent.png"
    );

    // LETTER IMAGES (none provided in assets, but keep key for API parity)
    assetRefs.current.letterImgs = {};

    setReady(true);
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
