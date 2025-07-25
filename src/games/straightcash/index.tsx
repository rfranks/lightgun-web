"use client";

import React from "react";
import { SKY_COLOR } from "./constants";
import { withBasePath } from "@/utils/basePath";
import TitleSplash from "./components/TitleSplash";
import GameUI from "./components/GameUI";
import ReadyGoSplash from "./components/ReadyGoSplash";
import ScoreSplash from "./components/ScoreSplash";
import useStraightCashGameEngine from "./hooks/useStraightCashGameEngine";

export default function Game() {
  const {
    phase,
    countdown,
    ui,
    canvasRef,
    handleClick,
    handleContext,
    resetRound,
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
    scoreReward,
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

  if (phase === "score") {
    return <ScoreSplash reward={scoreReward} onReset={resetRound} />;
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
