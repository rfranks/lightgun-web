import { useState, useRef, useCallback, useEffect } from "react";
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
  const [spinning, setSpinning] = useState<boolean[]>([false, false, false]);
  const [reelClicks, setReelClicks] = useState<({ x: number; y: number } | null)[]>([
    null,
    null,
    null,
  ]);
  const [bet, setBet] = useState<number>(1);
  const [tokens, setTokens] = useState<number>(100);

  const autoStopRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([
    null,
    null,
    null,
  ]);

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

  const stopReel = useCallback((index: number) => {
    setSpinning((prev) => {
      if (!prev[index]) return prev;
      const arr = [...prev];
      arr[index] = false;
      return arr;
    });
    if (autoStopRefs.current[index]) {
      clearTimeout(autoStopRefs.current[index]!);
      autoStopRefs.current[index] = null;
    }
  }, []);

  const handleReelClick = useCallback(
    (index: number, e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setReelClicks((prev) => {
        const arr = [...prev];
        arr[index] = pos;
        return arr;
      });
      if (!locked[index]) {
        stopReel(index);
      }
    },
    [locked, stopReel]
  );

  const startSpins = useCallback(
    (amount: number) => {
      if (tokens < amount) return;
      setBet(amount);
      setTokens((t) => t - amount);
      setSpinSpeed(1);
      setSpinning((prev) =>
        prev.map((_, i) => (locked[i] ? false : true))
      );
      for (let i = 0; i < 3; i++) {
        if (!locked[i]) {
          if (autoStopRefs.current[i]) {
            clearTimeout(autoStopRefs.current[i]!);
          }
          autoStopRefs.current[i] = setTimeout(() => stopReel(i), 30000);
        }
      }
    },
    [tokens, locked, stopReel]
  );

  const handleContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (spinning.some((s) => s)) {
      const id = setInterval(() => {
        setReelPos((pos) =>
          pos.map((p, i) => (spinning[i] ? (p + 1) % 55 : p))
        );
      }, 100);
      return () => clearInterval(id);
    }
  }, [spinning]);

  const resetGame = useCallback(() => {
    setPhase("title");
    setReelPos([0, 0, 0]);
    setSpinSpeed(0);
    setLocked([false, false, false]);
    setSpinning([false, false, false]);
    setReelClicks([null, null, null]);
    autoStopRefs.current.forEach((t) => {
      if (t) clearTimeout(t);
    });
    autoStopRefs.current = [null, null, null];
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
    startSpins,
    stopReel,
    handleReelClick,
    reelPos,
    reelClicks,
    spinSpeed,
    spinning,
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
