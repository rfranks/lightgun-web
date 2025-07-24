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
  const [reelResults, setReelResults] = useState<boolean[]>([false, false, false]);
  const [reelValues, setReelValues] = useState<number[]>([0, 0, 0]);
  const [tokenValue, setTokenValue] = useState<number>(1);
  const [wheelSpinning, setWheelSpinning] = useState(false);

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

  const cardValue = useCallback((rank: string) => {
    if (rank === "wheel" || rank === "blank" || rank === "Joker") return 0;
    if (rank === "A") return 50;
    if (rank === "K") return 30;
    if (rank === "Q") return 20;
    if (rank === "J") return 15;
    const n = parseInt(rank, 10);
    return isNaN(n) ? 0 : n;
  }, []);

  const handleSpinEnd = useCallback(
    (index: number, result: string) => {
      const isWheel = result === "wheel";
      setReelResults((prev) => {
        const arr = [...prev];
        arr[index] = isWheel;
        return arr;
      });
      const val = cardValue(result);
      setReelValues((prev) => {
        const arr = [...prev];
        arr[index] = val;
        return arr;
      });
      const click = reelClicks[index];
      if (val > 0 && click) {
        makeText(`${val}`, 0.5, click.x, click.y, 60);
      }
    },
    [cardValue, reelClicks, makeText]
  );

  const handleReelClick = useCallback(
    (index: number, e: React.MouseEvent<HTMLDivElement>) => {
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
    (amount: number, denom: number) => {
      if (tokens < amount) return;
      setBet(amount);
      setTokenValue(denom);
      setTokens((t) => t - amount);
      setReelValues([0, 0, 0]);
      setReelResults([false, false, false]);
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

  useEffect(() => {
    if (spinning.every((s) => !s)) {
      if (reelResults.every((r) => r)) {
        setPhase("wheel");
        setWheelSpinning(true);
      } else {
        const totalValue = reelValues.reduce((a, b) => a + b, 0);
        const maxTotal = Math.floor(10500 / tokenValue);
        let finalTotal = totalValue;
        const finalValues = [...reelValues];
        if (finalTotal > maxTotal) {
          for (let i = finalValues.length - 1; i >= 0 && finalTotal > maxTotal; i--) {
            const reduce = Math.min(finalValues[i], finalTotal - maxTotal);
            finalValues[i] -= reduce;
            finalTotal -= reduce;
          }
        }
        const payout = finalTotal * tokenValue;
        setTokens((t) => t + payout);
      }
    }
  }, [spinning, reelResults, reelValues, tokenValue]);

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

  const handleWheelFinish = useCallback((reward: string) => {
    setWheelSpinning(false);
    setPhase("playing");
    setReelResults([false, false, false]);
    // placeholder: reward handling could modify tokens
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
    handleSpinEnd,
    handleReelClick,
    reelPos,
    reelClicks,
    spinSpeed,
    spinning,
    locked,
    wheelSpinning,
    handleWheelFinish,
    bet,
    tokens,
    tokenValue,
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
