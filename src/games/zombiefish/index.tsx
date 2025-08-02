"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DEFAULT_CURSOR, SKY_COLOR } from "./constants";
import { withBasePath } from "@/utils/basePath";
import { TitleSplash } from "./components/TitleSplash";
import GameUI from "./components/GameUI";
import useZombiefishEngine from "./hooks/useGameEngine";

export default function Game() {
  const engine = useZombiefishEngine();

  const {
    ui,
    canvasRef,
    handleMouseMove,
    handleClick,
    handleContext,
    startSplash,
    ready: assetsReady,
  } = engine;

  const [startRequested, setStartRequested] = useState(false);

  const handleStart = useCallback(() => {
    if (assetsReady) {
      startSplash();
    } else {
      setStartRequested(true);
    }
  }, [assetsReady, startSplash]);

  useEffect(() => {
    if (assetsReady && startRequested) {
      startSplash();
      setStartRequested(false);
    }
  }, [assetsReady, startRequested, startSplash]);

  const { phase } = ui;

  // ─── RENDER SPLASH ────────────────────────────────────────────────────────
  if (phase === "title") {
    return (
      <TitleSplash
        onStart={handleStart}
        titleSrc={withBasePath("/assets/titles/zombiefish_title.png")}
        backgroundColor={SKY_COLOR}
        cursor={DEFAULT_CURSOR}
      />
    );
  }

  return (
    <GameUI
      ui={ui}
      canvasRef={canvasRef}
      handleClick={handleClick}
      handleContext={handleContext}
      handleMouseMove={handleMouseMove}
    />
  );
}

export { Game };
