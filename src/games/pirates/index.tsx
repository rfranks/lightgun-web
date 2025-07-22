"use client";
import React from "react";
import { DEFAULT_CURSOR } from "./constants";
import TitleSplash from "./components/TitleSplash";
import GameUI from "./components/GameUI";
import { useGameEngine } from "./hooks/useGameEngine";

export default function Game() {
  const {
    phase,
    startGame,
    canvasRef,
    handleClick,
    handleContext,
    ammo,
    score,
    getImg,
    cursor,
  } = useGameEngine();

  if (phase === "title") {
    return <TitleSplash onStart={startGame} />;
  }

  return (
    <GameUI
      score={score}
      ammo={ammo}
      canvasRef={canvasRef}
      handleClick={handleClick}
      handleContext={handleContext}
      getImg={getImg}
      cursor={cursor}
    />
  );
}
