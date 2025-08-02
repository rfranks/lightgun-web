// hooks/useGameAssets.ts
"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { TANK_EXPLOSION_SRC } from "@/constants/effects";
import {
  WATER_SRCS,
  TREE_SOURCES,
  ROCK_SRCS,
  GROUND_VARIANTS,
} from "@/constants/environment";
import {
  DUCK_SRCS,
  DUCK_TARGET_SRCS,
  DUCK_OUTLINE_SRCS,
} from "@/constants/objects";
import {
  NAPALM_MISSILE_SRC,
  NAPALM_FLAME_FRAME_SRCS,
  POWERUP_TYPES,
} from "@/constants/powerups";
import { SCORE_DIGIT_PATH } from "@/constants/ui";
import { ENEMY_COLORS, AIRSHIP_COLORS } from "@/constants/vehicles";
import { AssetMgr } from "@/types/ui";
import { withBasePath } from "@/utils/basePath";

/**
 * SSR-safe asset loader for browser games.
 * Ensures no client/server hydration errors!
 * Fully matches your dynamic AssetMgr type.
 */
export function useGameAssets(): {
  get: AssetMgr["get"];
  getImg: AssetMgr["getImg"];
  assetRefs: AssetMgr["assetRefs"];
  ready: boolean;
} {
  const [ready, setReady] = useState(false);

  // All asset refs live in a plain object, so you can string-key into it.
  const assetRefs = useRef<AssetMgr["assetRefs"]>({});

  useEffect(() => {
    if (typeof window === "undefined") return; // SSR guard

    // Utility to load an image and return it
    const loadImg = (src: string) => {
      const img = new window.Image();
      img.src = withBasePath(src);
      return img;
    };

    // AIRSHIP FRAMES
    assetRefs.current.airshipFrames = Object.fromEntries(
      AIRSHIP_COLORS.map((color) => [
        color,
        [1, 2, 3].map((i) =>
          loadImg(`/assets/airships/airship_${color}_${i}.png`)
        ),
      ])
    );

    // ARTILLERY
    assetRefs.current.artilleryImg = loadImg(
      "/assets/tanks/PNG/Retina/tank_bulletFly6.png"
    );

    // BLACK SMOKE
    assetRefs.current.blackSmokeImgs = Array.from({ length: 25 }, (_, i) =>
      loadImg(
        `/assets/smoke/PNG/Black smoke/blackSmoke${String(i).padStart(
          2,
          "0"
        )}.png`
      )
    );

    // BROKEN STICK
    assetRefs.current.brokenStickImg = loadImg(
      "/assets/shooting-gallery/PNG/Objects/stick_wood_broken.png"
    );

    // BULLET HOLE
    assetRefs.current.bulletHoleImg = loadImg(
      "/assets/shooting-gallery/PNG/Objects/shot_brown_large.png"
    );

    // CANNONBALL
    assetRefs.current.cannonballImg = loadImg(
      "/assets/pirates/PNG/Retina/Ship parts/cannonBall.png"
    );

    // DIGIT IMAGES
    assetRefs.current.digitImgs = {};
    for (let d = 0; d <= 9; d++) {
      assetRefs.current.digitImgs[d.toString()] = loadImg(
        `${SCORE_DIGIT_PATH}${d}.png`
      );
    }

    // DUCKS
    assetRefs.current.duckImgs = DUCK_SRCS.map(loadImg);
    assetRefs.current.duckOutlineImgs = DUCK_OUTLINE_SRCS.map(loadImg);
    assetRefs.current.duckTargetImgs = DUCK_TARGET_SRCS.map(loadImg);

    // ENEMIES
    assetRefs.current.enemyImgs = ENEMY_COLORS.map(loadImg);
    assetRefs.current.enemyFrames = ENEMY_COLORS.map((base) =>
      [1, 2, 3].map((i) => loadImg(base.replace(/1\.png$/, `${i}.png`)))
    );

    // EXPLOSION
    assetRefs.current.explosionImgs = TANK_EXPLOSION_SRC.map(loadImg);

    // FIRE/FLAME
    assetRefs.current.fireImgs = [
      loadImg("/assets/pirates/PNG/Retina/Effects/fire1.png"),
      loadImg("/assets/pirates/PNG/Retina/Effects/fire2.png"),
    ];
    assetRefs.current.flameImgs = NAPALM_FLAME_FRAME_SRCS.map(loadImg);

    // GROUND
    assetRefs.current.groundImgs = GROUND_VARIANTS.map(loadImg);

    // HOMING
    assetRefs.current.homingImg = loadImg(
      "/assets/tanks/PNG/Retina/tank_bullet3.png"
    );

    // LETTER IMAGES
    assetRefs.current.letterImgs = {};
    for (let c = 65; c <= 90; c++) {
      const ch = String.fromCharCode(c);
      assetRefs.current.letterImgs[ch] = loadImg(
        `/assets/tappyplane/PNG/Letters/letter${ch}.png`
      );
    }

    // MEDAL FRAMES
    assetRefs.current.medalFrames = [];
    for (let i = 1; i <= 9; i++) {
      (assetRefs.current.medalFrames as HTMLImageElement[][]).push([
        loadImg(`/assets/medals/PNG/flat_medal${i}.png`),
        loadImg(`/assets/medals/PNG/flatshadow_medal${i}.png`),
        loadImg(`/assets/medals/PNG/shaded_medal${i}.png`),
      ]);
    }

    // NAPALM
    assetRefs.current.napalmImg = loadImg(NAPALM_MISSILE_SRC);

    // NUMBER IMAGES
    assetRefs.current.numberImgs = {};
    for (let n = 0; n <= 9; n++) {
      assetRefs.current.numberImgs[n.toString()] = loadImg(
        `/assets/tappyplane/PNG/Numbers/number${n}.png`
      );
    }

    // PLANE FRAMES/IMG
    assetRefs.current.planeFrames = [1, 2, 3].map((i) =>
      loadImg(`/assets/tappyplane/PNG/Planes/planeYellow${i}.png`)
    );
    assetRefs.current.planeImg = assetRefs.current.planeFrames[0];

    // PLUS
    assetRefs.current.plusImg = loadImg(
      "/assets/shooting-gallery/PNG/HUD/text_plus_small.png"
    );

    // POWERUPS
    assetRefs.current.powerupImgs = Object.fromEntries(
      POWERUP_TYPES.map((type) => [
        type,
        loadImg(`/assets/powerups/${type}.png`),
      ])
    );
    assetRefs.current.powerupImgs.coin2x = loadImg(
      "/assets/powerups/coin_2x.png"
    );
    assetRefs.current.powerupImgs.infiniteAmmo = loadImg(
      "/assets/powerups/infinite_ammo.png"
    );
    assetRefs.current.powerupImgs.machineGuns = loadImg(
      "/assets/powerups/machine_guns.png"
    );
    assetRefs.current.powerupImgs.autoReload = loadImg(
      "/assets/powerups/autoReload.png"
    );
    assetRefs.current.powerupImgs.shrink = loadImg(
      "/assets/powerups/shrink_effect.png"
    );

    // PUFF
    assetRefs.current.puffLargeImg = loadImg(
      "/assets/tappyplane/PNG/puffLarge.png"
    );
    assetRefs.current.puffSmallImg = loadImg(
      "/assets/tappyplane/PNG/puffSmall.png"
    );

    // ROCKS
    assetRefs.current.rockImgs = ROCK_SRCS.map(loadImg);

    // SHIELD
    assetRefs.current.shieldImg = loadImg(
      "/assets/particles/PNG (Transparent)/circle_03.png"
    );

    // SPARKS
    assetRefs.current.sparkImgs = Array.from({ length: 7 }, (_, i) =>
      loadImg(`/assets/particles/PNG (Transparent)/spark_0${i + 1}.png`)
    );

    // LASER BEAM
    assetRefs.current.laserBeamImgs = [
      loadImg(
        "/assets/space-shooter-redux/PNG/Lasers/laserRed04.png"
      ),
      loadImg(
        "/assets/space-shooter-redux/PNG/Lasers/laserRed04.png"
      ),
    ];

    // STICK
    assetRefs.current.stickImg = loadImg(
      "/assets/shooting-gallery/PNG/Objects/stick_wood.png"
    );

    // TARGETS
    assetRefs.current.targetImgs = [
      loadImg("/assets/shooting-gallery/PNG/Objects/target_red1.png"),
      loadImg("/assets/shooting-gallery/PNG/Objects/target_red2.png"),
      loadImg("/assets/shooting-gallery/PNG/Objects/target_red3.png"),
    ];

    // TREES
    assetRefs.current.treeImgs = TREE_SOURCES.map(loadImg);

    // WATER
    assetRefs.current.waterImgs = WATER_SRCS.map(loadImg);

    // WHITE PUFF
    assetRefs.current.whitePuffImgs = Array.from({ length: 25 }, (_, i) =>
      loadImg(
        `/assets/smoke/PNG/White puff/whitePuff${String(i).padStart(
          2,
          "0"
        )}.png`
      )
    );

    setReady(true);
  }, []);

  // Generic getters as specified in your AssetMgr
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
