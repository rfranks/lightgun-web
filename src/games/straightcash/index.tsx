"use client";

import React from "react";
import { DEFAULT_CURSOR, SKY_COLOR } from "./constants";
import { withBasePath } from "@/utils/basePath";
import TitleSplash from "./components/TitleSplash";
import GameUI from "./components/GameUI";
import ReadyGoSplash from "./components/ReadyGoSplash";
import useGameEngine from "./hooks/useGameEngine";

export default function Game() {
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
  } = useGameEngine();

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
      cursor={ui.cursor}
      canvasRef={canvasRef}
      handleClick={handleClick}
      handleContext={handleContext}
    />
  );
}

export { Game };
