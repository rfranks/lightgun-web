import { useState, useRef, useCallback } from "react";
import { DEFAULT_CURSOR } from "../constants";
import { AudioMgr } from "@/types/audio";
import { TextLabel } from "@/types/ui";
import useStraightCashAudio from "./useStraightCashAudio";

/**
 * Straight Cash game engine hook.
 * Manages basic slot machine state like reels and tokens.
 */
export default function useStraightCashGameEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"title" | "ready" | "playing" | "wheel">(
    "title"
  );
  const [countdown] = useState<number | null>(null);

  // simple slot machine state
  const [reelPos, setReelPos] = useState<number[]>([0, 0, 0]);
  const [spinSpeed, setSpinSpeed] = useState<number>(0);
  const [locked, setLocked] = useState<boolean[]>([false, false, false]);
  const [bet, setBet] = useState<number>(1);
  const [tokens, setTokens] = useState<number>(100);

  const textLabels = useRef<TextLabel[]>([]);

  const audioMgr: AudioMgr = useStraightCashAudio();

  const ui = { cursor: DEFAULT_CURSOR };

  const makeText = useCallback(
    (text: string, scale: number, x?: number, y?: number, maxAge = 60) => {
      textLabels.current.push({
        text,
        scale,
        fixed: true,
        fade: true,
        x: x ?? 0,
        y: y ?? 0,
        age: 0,
        maxAge,
      });
    },
    []
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    // placeholder for gameplay interaction
  }, []);

  const handleContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const resetGame = useCallback(() => {
    setPhase("title");
    setReelPos([0, 0, 0]);
    setSpinSpeed(0);
    setLocked([false, false, false]);
    setBet(1);
    setTokens(100);
    textLabels.current = [];
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
    reelPos,
    spinSpeed,
    locked,
    bet,
    tokens,
    setReelPos,
    setSpinSpeed,
    setLocked,
    setBet,
    setTokens,
    makeText,
    textLabels: textLabels.current,
    audioMgr,
  };
}
