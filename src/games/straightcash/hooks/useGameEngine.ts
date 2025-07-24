import { useState, useRef, useCallback } from "react";
import { DEFAULT_CURSOR } from "../constants";
import { AudioMgr } from "@/types/audio";
import useStraightCashAudio from "./useStraightCashAudio";

export default function useGameEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"title" | "ready" | "go" | "playing">(
    "title"
  );
  const [countdown] = useState<number | null>(null);

  const audioMgr: AudioMgr = useStraightCashAudio();

  const ui = { cursor: DEFAULT_CURSOR };

  const handleClick = useCallback((e: React.MouseEvent) => {
    // placeholder for gameplay interaction
  }, []);

  const handleContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const resetGame = useCallback(() => {
    setPhase("title");
  }, []);

  const getImg = useCallback(() => undefined, []);

  const startSplash = useCallback(() => {
    setPhase("playing");
  }, []);

  return {
    phase,
    countdown,
    ui,
    canvasRef,
    handleClick,
    handleContext,
    resetGame,
    getImg,
    startSplash,
  };
}
