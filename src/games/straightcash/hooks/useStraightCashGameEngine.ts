import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { DEFAULT_CURSOR, SHOT_CURSOR } from "../constants";
import { AudioMgr } from "@/types/audio";
import { TextLabel } from "@/types/ui";
import useStraightCashAudio from "./useStraightCashAudio";

const REEL_RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

const RESULT_POOL = (() => {
  const arr = ["blank", "+spin"] as string[];
  for (const r of REEL_RANKS) {
    for (let i = 0; i < 4; i++) arr.push(r);
  }
  arr.push("wheel");
  return arr;
})();

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
  const [dieActive, setDieActive] = useState<boolean[]>([false, false, false]);
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
  const [wheelReady, setWheelReady] = useState(false);
  const [forcedResults, setForcedResults] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);

  const isReelDisabled = useCallback(
    (index: number) => {
      if (bet < 5) return index > 0;
      if (bet < 10) return index > 1;
      return false;
    },
    [bet]
  );

  const autoStopRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([
    null,
    null,
    null,
  ]);
  const spinStartRef = useRef<number | null>(null);

  const textLabels = useRef<TextLabel[]>([]);

  const audioMgr: AudioMgr = useStraightCashAudio();

  // card slide sound cycling
  const slideKeys = useMemo(
    () => [
      "cardSlide1Sfx",
      "cardSlide2Sfx",
      "cardSlide3Sfx",
      "cardSlide4Sfx",
      "cardSlide5Sfx",
      "cardSlide6Sfx",
      "cardSlide7Sfx",
      "cardSlide8Sfx",
    ],
    []
  );
  const slideIdxRef = useRef(0);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cursor, setCursor] = useState<string>(DEFAULT_CURSOR);
  const triggerShotCursor = useCallback(() => {
    setCursor(SHOT_CURSOR);
    setTimeout(() => setCursor(DEFAULT_CURSOR), 100);
  }, []);

  const ui = { cursor };

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

  const autoStop = useCallback(
    (index: number) => {
      const rand = RESULT_POOL[Math.floor(Math.random() * RESULT_POOL.length)];
      setForcedResults((prev) => {
        const arr = [...prev];
        arr[index] = rand;
        return arr;
      });
      stopReel(index);
    },
    [stopReel]
  );

  const cardValue = useCallback((rank: string) => {
    if (rank === "wheel" || rank === "blank" || rank === "Joker" || rank === "+spin")
      return 0;
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
      if (result === "+spin") {
        setLocked((prev) => {
          const arr = [...prev];
          arr[index] = true;
          return arr;
        });
        setDieActive((prev) => {
          const arr = [...prev];
          arr[index] = true;
          return arr;
        });
      }
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
      if (dieActive[index]) {
        setDieActive((prev) => {
          const arr = [...prev];
          arr[index] = false;
          return arr;
        });
        setLocked((prev) => {
          const arr = [...prev];
          arr[index] = false;
          return arr;
        });
        setSpinning((prev) => {
          const arr = [...prev];
          arr[index] = true;
          return arr;
        });
        setForcedResults((prev) => {
          const arr = [...prev];
          arr[index] = null;
          return arr;
        });
        if (autoStopRefs.current[index]) {
          clearTimeout(autoStopRefs.current[index]!);
        }
        autoStopRefs.current[index] = setTimeout(() => autoStop(index), 30000);
      } else if (!locked[index]) {
        setForcedResults((prev) => {
          const arr = [...prev];
          arr[index] = null;
          return arr;
        });
        stopReel(index);
      }
    },
    [locked, dieActive, stopReel]
  );

  const startSpins = useCallback(
    (amount: number, denom: number) => {
      if (tokens < amount) return;
      setBet(amount);
      setTokenValue(denom);
      setTokens((t) => t - amount);
      spinStartRef.current = Date.now();
      setReelValues([0, 0, 0]);
      setReelResults([false, false, false]);
      setForcedResults([null, null, null]);
      setSpinSpeed(1);
      setSpinning((prev) =>
        prev.map((_, i) => (locked[i] ? false : true))
      );
      for (let i = 0; i < 3; i++) {
        if (!locked[i]) {
          if (autoStopRefs.current[i]) {
            clearTimeout(autoStopRefs.current[i]!);
          }
          autoStopRefs.current[i] = setTimeout(() => autoStop(i), 30000);
        }
      }
    },
    [tokens, locked, autoStop]
  );

  const handleContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // play sliding sounds while any reel spins
  useEffect(() => {
    if (spinning.some((s) => s)) {
      const playNext = () => {
        const key = slideKeys[slideIdxRef.current % slideKeys.length];
        audioMgr.play(key);
        slideIdxRef.current = (slideIdxRef.current + 1) % slideKeys.length;
        slideTimerRef.current = window.setTimeout(playNext, 100);
      };
      playNext();
      return () => {
        if (slideTimerRef.current) {
          clearTimeout(slideTimerRef.current);
          slideTimerRef.current = null;
        }
        slideKeys.forEach((k) => audioMgr.pause(k));
      };
    }
  }, [spinning, audioMgr, slideKeys]);

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
      const activeIndices = [0, 1, 2].filter((i) => !isReelDisabled(i));
      if (activeIndices.every((i) => reelResults[i])) {
        setWheelReady(true);
      } else {
        const totalValue = reelValues.reduce(
          (sum, val, i) => (isReelDisabled(i) ? sum : sum + val),
          0
        );
        const maxTotal = Math.floor(10500 / tokenValue);
        let finalTotal = totalValue;
        if (finalTotal > maxTotal) {
          for (let i = reelValues.length - 1; i >= 0 && finalTotal > maxTotal; i--) {
            if (isReelDisabled(i)) continue;
            const reduce = Math.min(reelValues[i], finalTotal - maxTotal);
            finalTotal -= reduce;
          }
        }
        const payout = finalTotal * tokenValue;
        const nudge = Math.random() * 2 - 1; // small payout adjustment
        const finalPayout = Math.max(0, Math.round(payout + nudge));
        if (finalPayout > 0) {
          audioMgr.play("payoutSfx");
        }
        setTokens((t) => t + finalPayout);
      }
    }
  }, [spinning, reelResults, reelValues, tokenValue, isReelDisabled, audioMgr]);

  const resetGame = useCallback(() => {
    setPhase("title");
    setReelPos([0, 0, 0]);
    setSpinSpeed(0);
    setLocked([false, false, false]);
    setSpinning([false, false, false]);
    setReelClicks([null, null, null]);
    setDieActive([false, false, false]);
    autoStopRefs.current.forEach((t) => {
      if (t) clearTimeout(t);
    });
    autoStopRefs.current = [null, null, null];
    spinStartRef.current = null;
    setForcedResults([null, null, null]);
    setBet(1);
    setTokens(100);
    setWheelReady(false);
    audioMgr.pause("wheelSpinSfx");
    slideKeys.forEach((k) => audioMgr.pause(k));
    textLabels.current = [];
  }, [audioMgr, slideKeys]);

  const getImg = useCallback(() => undefined, []);

  const startSplash = useCallback(() => {
    setPhase("playing");
  }, []);

  const handleWheelStart = useCallback(() => {
    if (!wheelReady) return;
    setWheelReady(false);
    setWheelSpinning(true);
    setPhase("wheel");
    audioMgr.play("wheelSpinSfx", { loop: true });
  }, [wheelReady, audioMgr]);

  const handleWheelFinish = useCallback((reward: string) => {
    setWheelSpinning(false);
    setPhase("playing");
    setReelResults([false, false, false]);
    audioMgr.pause("wheelSpinSfx");
    // placeholder: reward handling could modify tokens
  }, [audioMgr]);

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
    dieActive,
    forcedResults,
    wheelReady,
    wheelSpinning,
    handleWheelStart,
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
    triggerShotCursor,
  };
}
