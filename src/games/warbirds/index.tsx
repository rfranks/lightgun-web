"use client";

import React from "react";
import { DEFAULT_CURSOR, SKY_COLOR } from "./constants";
import { withBasePath } from "@/utils/basePath";
import { TitleSplash } from "./components/TitleSplash";
import GameUI from "./components/GameUI";
import useGameEngine from "./hooks/useGameEngine";

export default function Game() {
  const engine = useGameEngine();

  const {
    phase,
    ui,
    canvasRef,
    handleClick,
    handleContext,
    resetGame,
    getImg,
    startSplash,
  } = engine;

  // ─── RENDER SPLASH ────────────────────────────────────────────────────────
  if (phase === "title") {
    return (
      <TitleSplash
        onStart={startSplash}
        titleSrc={withBasePath("/assets/titles/warbirds_title.png")}
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
      resetGame={resetGame}
      getImg={getImg}
    />
  );
}
