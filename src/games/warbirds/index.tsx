"use client";

import React from "react";
import { DEFAULT_CURSOR, SKY_COLOR } from "./constants";
import { withBasePath } from "@/utils/basePath";
import { TitleSplash } from "./components/TitleSplash";
import GameUI from "./components/GameUI";
import ReadyGoSplash from "./components/ReadyGoSplash";
import useGameEngine from "./hooks/useGameEngine";

export default function Game() {
  const engine = useGameEngine();

  const {
    phase,
    countdown,
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

  if (phase === "ready" || phase === "go") {
    return <ReadyGoSplash phase={phase} countdown={countdown} />;
  }

  return (
    <GameUI
      ammo={ui.ammo}
      medalCount={ui.medalCount}
      duckCount={ui.duckCount}
      enemyCount={ui.enemyCount}
      score={ui.score}
      crashed={ui.crashed}
      frameCount={ui.frameCount}
      activePowerups={ui.activePowerups}
      cursor={ui.cursor}
      canvasRef={canvasRef}
      handleClick={handleClick}
      handleContext={handleContext}
      resetGame={resetGame}
      getImg={getImg}
    />
  );
}
