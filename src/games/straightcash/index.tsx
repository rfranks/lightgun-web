"use client";

import React from "react";
import { DEFAULT_CURSOR, SKY_COLOR } from "./constants";
import { withBasePath } from "@/utils/basePath";
import TitleSplash from "./components/TitleSplash";
import GameUI from "./components/GameUI";
import ReadyGoSplash from "./components/ReadyGoSplash";
import useStraightCashGameEngine from "./hooks/useStraightCashGameEngine";

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
  } = useStraightCashGameEngine();

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

  if (phase === "ready") {
    return <ReadyGoSplash phase="ready" countdown={countdown} />;
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
