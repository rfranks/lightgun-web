import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { DEFAULT_CURSOR, SHOT_CURSOR } from "../constants";
import { AudioMgr } from "@/types/audio";
import { TextLabel } from "@/types/ui";
import { drawTextLabels } from "@/utils/ui";
import useStraightCashAudio from "./useStraightCashAudio";
import type { ClickEvent } from "@/types/events";
import type { JackpotHandle } from "../components/JackpotDisplay";

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

const RANK_ORDER = [
  "A",
  "K",
  "Q",
  "J",
  "10",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
  "blank",
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
  const [phase, setPhase] = useState<
    "title" | "ready" | "playing" | "wheel" | "score"
  >("title");
  const [countdown] = useState<number | null>(null);

  // simple slot machine state
  const [reelPos, setReelPos] = useState<number[]>([0, 0, 0]);
  const [spinSpeed, setSpinSpeed] = useState<number>(0);
  const [locked, setLocked] = useState<boolean[]>([false, false, false]);
  const [spinning, setSpinning] = useState<boolean[]>([false, false, false]);
  const [dieActive, setDieActive] = useState<boolean[]>([false, false, false]);
  const [reelClicks, setReelClicks] = useState<
    ({ x: number; y: number } | null)[]
  >([null, null, null]);
  const [bet, setBet] = useState<number>(1);
  const [tokens, setTokens] = useState<number>(100);
  const prevTokensRef = useRef<number>(100);
  const jackpotRef = useRef<JackpotHandle>(null);
  const [reelResults, setReelResults] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const [reelValues, setReelValues] = useState<number[]>([0, 0, 0]);
  const [reelRanks, setReelRanks] = useState<string[]>([
    "blank",
    "blank",
    "blank",
  ]);
  const [tokenValue, setTokenValue] = useState<number>(1);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelReady, setWheelReady] = useState(false);
  const [scoreReward, setScoreReward] = useState<string | number | null>(null);
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
  const slideTimerRef = useRef<number | null>(null);

  // chip award sounds
  const chipAwardKeys = useMemo(
    () => [
      "chipsHandle1Sfx",
      "chipsHandle2Sfx",
      "chipsHandle3Sfx",
      "chipsHandle4Sfx",
      "chipsHandle5Sfx",
      "chipsHandle6Sfx",
      "chipsStack1Sfx",
      "chipsStack2Sfx",
      "chipsStack3Sfx",
      "chipsStack4Sfx",
      "chipsStack5Sfx",
      "chipsStack6Sfx",
      "chipLay1Sfx",
      "chipLay2Sfx",
      "chipLay3Sfx",
      "chipsCollide1Sfx",
      "chipsCollide2Sfx",
      "chipsCollide3Sfx",
      "chipsCollide4Sfx",
    ],
    []
  );

  // play chip sounds whenever tokens increase
  useEffect(() => {
    if (tokens > prevTokensRef.current) {
      const key =
        chipAwardKeys[Math.floor(Math.random() * chipAwardKeys.length)];
      audioMgr.play(key);
    }
    prevTokensRef.current = tokens;
  }, [tokens, chipAwardKeys, audioMgr]);

  const nextLowerRank = useCallback((rank: string) => {
    const idx = RANK_ORDER.indexOf(rank);
    return idx >= 0 && idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : rank;
  }, []);

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
        imgs: [],
        spaceGap: 0,
      });
    },
    []
  );

  const handleClick = useCallback((e: ClickEvent) => {
    void e;
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
    if (
      rank === "wheel" ||
      rank === "blank" ||
      rank === "Joker" ||
      rank === "+spin"
    )
      return 0;
    if (rank === "A") return 50;
    if (rank === "K") return 30;
    if (rank === "Q") return 20;
    if (rank === "J") return 15;
    const n = parseInt(rank, 10);
    return isNaN(n) ? 0 : n;
  }, []);

  const maybeTriggerSpinDie = useCallback(
    (index: number) => {
      // 10% chance to activate the spinning die feature
      if (Math.random() < 0.1) {
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

        // re-spin any other reel that currently has no card value
        setSpinning((prev) => {
          const arr = [...prev];
          for (let i = 0; i < arr.length; i++) {
            if (i !== index && reelValues[i] === 0 && !locked[i]) {
              arr[i] = true;
              if (autoStopRefs.current[i]) {
                clearTimeout(autoStopRefs.current[i]!);
              }
              autoStopRefs.current[i] = setTimeout(() => autoStop(i), 30000);
            }
          }
          return arr;
        });

        setForcedResults((prev) => {
          const arr = [...prev];
          for (let i = 0; i < arr.length; i++) {
            if (i !== index && reelValues[i] === 0 && !locked[i]) {
              arr[i] = null;
            }
          }
          return arr;
        });
      }
    },
    [reelValues, locked, autoStop]
  );

  const handleSpinEnd = useCallback(
    (index: number, result: string) => {
      const isWheel = result === "wheel";
      setReelResults((prev) => {
        const arr = [...prev];
        arr[index] = isWheel;
        return arr;
      });
      setReelRanks((prev) => {
        const arr = [...prev];
        arr[index] = result;
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
      maybeTriggerSpinDie(index);
    },
    [cardValue, reelClicks, makeText, maybeTriggerSpinDie]
  );

  const handleReelClick = useCallback(
    (index: number, e: React.MouseEvent<HTMLDivElement>) => {
      triggerShotCursor();
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

        // stop disabled reels if this was the last active reel
        const upcomingSpinning = spinning.map((s, i) =>
          i === index ? false : s
        );
        const anyActiveSpinning = upcomingSpinning.some(
          (spin, i) => !isReelDisabled(i) && spin
        );
        if (!anyActiveSpinning) {
          for (let i = 0; i < upcomingSpinning.length; i++) {
            if (isReelDisabled(i) && upcomingSpinning[i]) {
              stopReel(i);
            }
          }
        }
      }
    },
    [
      triggerShotCursor,
      dieActive,
      locked,
      autoStop,
      stopReel,
      spinning,
      isReelDisabled,
    ]
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
      setSpinning((prev) => prev.map((_, i) => (locked[i] ? false : true)));
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

  const resetRound = useCallback(() => {
    setPhase("playing");
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
    setWheelReady(false);
    audioMgr.pause("wheelSpinSfx");
    slideKeys.forEach((k) => audioMgr.pause(k));
    textLabels.current = [];
  }, [audioMgr, slideKeys]);

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
    if (phase === "score") {
      const id = window.setTimeout(() => resetRound(), 3000);
      return () => window.clearTimeout(id);
    }
  }, [phase, resetRound]);

  // canvas render loop for floating text labels
  useEffect(() => {
    if (phase === "playing" || phase === "wheel") {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      let raf: number;
      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        textLabels.current = drawTextLabels({
          textLabels: textLabels.current,
          ctx,
          cull: true,
        });
        raf = requestAnimationFrame(render);
      };
      render();
      return () => cancelAnimationFrame(raf);
    }
  }, [phase]);

  useEffect(() => {
    if (spinning.every((s) => !s) && spinStartRef.current !== null) {
      const activeIndices = [0, 1, 2].filter((i) => !isReelDisabled(i));
      if (activeIndices.every((i) => reelResults[i])) {
        setWheelReady(true);
      } else {
        const totalValue = reelValues.reduce(
          (sum, val, i) => (isReelDisabled(i) ? sum : sum + val),
          0
        );
        const maxTotal = Math.floor(10500 / tokenValue);
        const finalRanks = [...reelRanks];
        const finalValues = [...reelValues];
        let finalTotal = totalValue;
        let needsNudge = false;
        if (finalTotal > maxTotal) {
          needsNudge = true;
          let diff = finalTotal - maxTotal;
          for (let i = finalRanks.length - 1; i >= 0 && diff > 0; i--) {
            if (isReelDisabled(i)) continue;
            let rank = finalRanks[i];
            let val = finalValues[i];
            while (diff > 0) {
              const lower = nextLowerRank(rank);
              if (lower === rank) break;
              const lowerVal = cardValue(lower);
              diff -= val - lowerVal;
              rank = lower;
              val = lowerVal;
            }
            finalRanks[i] = rank;
            finalValues[i] = val;
          }
          finalTotal = finalValues.reduce(
            (sum, val, i) => (isReelDisabled(i) ? sum : sum + val),
            0
          );
          setTimeout(() => {
            setReelRanks(finalRanks);
            setReelValues(finalValues);
            setForcedResults((prev) => {
              const arr = [...prev];
              for (let i = 0; i < arr.length; i++) arr[i] = finalRanks[i];
              return arr;
            });
          }, 100);
        }
        const payout = finalTotal * tokenValue;
        const nudge = Math.random() * 2 - 1; // small payout adjustment
        const finalPayout = Math.max(0, Math.round(payout + nudge));
        const award = () => {
          if (finalPayout > 0) {
            audioMgr.play("payoutSfx");
          }
          setTokens((t) => t + finalPayout);
          setScoreReward(finalPayout);
          setPhase("score");
          spinStartRef.current = null;
        };
        if (needsNudge) {
          setTimeout(award, 400);
        } else {
          award();
        }
      }
    }
  }, [
    spinning,
    reelResults,
    reelValues,
    reelRanks,
    tokenValue,
    isReelDisabled,
    audioMgr,
    cardValue,
    nextLowerRank,
  ]);

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

  const handleWheelFinish = useCallback(
    (reward: string) => {
      setWheelSpinning(false);
      setReelResults([false, false, false]);
      audioMgr.pause("wheelSpinSfx");
      let payout = 0;
      if (reward === "Minor" || reward === "Major" || reward === "Grand") {
        const type = reward.toLowerCase() as "minor" | "major" | "grand";
        payout = jackpotRef.current?.awardJackpot(type) ?? 0;
      } else {
        const numeric = parseInt(reward, 10);
        payout = numeric * bet * tokenValue;
      }
      setTokens((t) => t + payout);
      setScoreReward(reward);
      setPhase("score");
    },
    [audioMgr, bet, tokenValue]
  );

  return {
    phase,
    countdown,
    ui,
    canvasRef,
    handleClick,
    handleContext,
    resetGame,
    resetRound,
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
    scoreReward,
    bet,
    tokens,
    tokenValue,
    setTokenValue,
    setReelPos,
    setSpinSpeed,
    setLocked,
    setBet,
    setTokens,
    makeText,
    textLabels: textLabels.current,
    audioMgr,
    jackpotRef,
    triggerShotCursor,
  };
}
