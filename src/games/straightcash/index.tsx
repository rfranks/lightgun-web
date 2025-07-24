"use client";

import React from "react";
import { SKY_COLOR } from "./constants";
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
    startSpins,
    spinning,
    locked,
    dieActive,
    handleReelClick,
    handleSpinEnd,
    forcedResults,
    wheelSpinning,
    wheelReady,
    handleWheelStart,
    handleWheelFinish,
    bet,
    triggerShotCursor,
  } = useStraightCashGameEngine();

  if (phase === "title") {
    return (
      <TitleSplash
        onStart={startSplash}
        titleSrc={withBasePath("/assets/titles/warbirds_title.png")}
        backgroundColor={SKY_COLOR}
        cursor={ui.cursor}
        onShot={triggerShotCursor}
      />
    );
  }

  if (phase === "ready") {
    return <ReadyGoSplash phase="ready" countdown={countdown} />;
  }

  return (
    <GameUI
      cursor={ui.cursor}
      onShot={triggerShotCursor}
      canvasRef={canvasRef}
      handleClick={handleClick}
      handleContext={handleContext}
      startSpins={startSpins}
      spinning={spinning}
      locked={locked}
      showDie={dieActive}
      handleReelClick={handleReelClick}
      onSpinEnd={handleSpinEnd}
      forcedResults={forcedResults}
      wheelSpinning={wheelSpinning}
      wheelReady={wheelReady}
      onWheelStart={handleWheelStart}
      onWheelFinish={handleWheelFinish}
      bet={bet}
    />
  );
}

export { Game };
