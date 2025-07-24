"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { AssetMgr } from "@/types/ui";
import { withBasePath } from "@/utils/basePath";

/**
 * Loads Straight Cash specific game assets on the client.
 * Provides accessors compatible with the generic AssetMgr interface.
 */
export function useStraightCashAssets(): {
  get: AssetMgr["get"];
  getImg: AssetMgr["getImg"];
  assetRefs: AssetMgr["assetRefs"];
  ready: boolean;
} {
  const [ready, setReady] = useState(false);
  const assetRefs = useRef<AssetMgr["assetRefs"]>({});

  useEffect(() => {
    if (typeof window === "undefined") return; // SSR guard

    const loadImg = (src: string) => {
      const img = new window.Image();
      img.src = withBasePath(src);
      return img;
    };

    // ─── PLAYING CARDS ────────────────────────────────────────────────
    assetRefs.current.cardImgs = {};
    const suits = ["Clubs", "Diamonds", "Hearts", "Spades"];
    const ranks = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];
    for (const suit of suits) {
      for (const rank of ranks) {
        const key = `${suit}${rank}`;
        (assetRefs.current.cardImgs as Record<string, HTMLImageElement>)[key] =
          loadImg(`/assets/boardgame/PNG/Cards/card${suit}${rank}.png`);
      }
    }
    (assetRefs.current.cardImgs as Record<string, HTMLImageElement>)["Joker"] =
      loadImg("/assets/boardgame/PNG/Cards/cardJoker.png");
    const colors = ["blue", "green", "red"];
    for (const color of colors) {
      for (let i = 1; i <= 5; i++) {
        const key = `back_${color}${i}`;
        (assetRefs.current.cardImgs as Record<string, HTMLImageElement>)[key] =
          loadImg(`/assets/boardgame/PNG/Cards/cardBack_${color}${i}.png`);
      }
    }

    // ─── DICE IMAGES ─────────────────────────────────────────────────
    assetRefs.current.diceImgs = {};
    const dieVariants = ["Red", "Red_border", "White", "White_border"];
    for (const variant of dieVariants) {
      for (let i = 1; i <= 6; i++) {
        const key = `${variant}${i}`;
        (assetRefs.current.diceImgs as Record<string, HTMLImageElement>)[key] =
          loadImg(`/assets/boardgame/PNG/Dice/die${variant}${i}.png`);
      }
    }

    // ─── WHEEL BONUS CHIP ────────────────────────────────────────────
    assetRefs.current.wheelBonusChipImg = loadImg(
      "/assets/boardgame/PNG/Chips/chipGreenWhite_border.png"
    );

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

export default useStraightCashAssets;
