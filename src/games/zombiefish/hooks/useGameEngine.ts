import { useRef, useState, useEffect, useCallback } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useGameAssets } from "./useGameAssets";
import type { GameState, GameUIState } from "../types";

const GAME_TIME = 60 * 30; // 30 seconds in frames

export default function useGameEngine() {
  // canvas and animation frame refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // assets
  const { getImg, ready } = useGameAssets();

  // window dimensions
  const dims = useWindowSize();

  // main game state stored in a ref so we can mutate without re-render
  const state = useRef<GameState>({
    phase: "title",
    timer: GAME_TIME,
    shots: 0,
    hits: 0,
    dims,
  });

  // ui state that triggers re-renders
  const [ui, setUI] = useState<GameUIState>({
    phase: "title",
    timer: GAME_TIME,
    shots: 0,
    hits: 0,
  });

  // sync dims when window size changes
  useEffect(() => {
    state.current.dims = dims;
  }, [dims]);

  // main loop updates timer
  const loop = useCallback(() => {
    const cur = state.current;
    if (cur.phase !== "playing") return;
    cur.timer = Math.max(0, cur.timer - 1);
    if (cur.timer === 0) {
      cur.phase = "gameover";
    }
    setUI({ phase: cur.phase, timer: cur.timer, shots: cur.shots, hits: cur.hits });
    animationFrameRef.current = requestAnimationFrame(loop);
  }, []);

  // start the game
  const startSplash = useCallback(() => {
    const cur = state.current;
    cur.phase = "playing";
    cur.timer = GAME_TIME;
    cur.shots = 0;
    cur.hits = 0;
    setUI({ phase: cur.phase, timer: cur.timer, shots: cur.shots, hits: cur.hits });
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // handle left click – record a shot and a hit (placeholder)
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const cur = state.current;
    if (cur.phase !== "playing") return;
    cur.shots += 1;
    cur.hits += 1; // TODO: collision detection to determine real hits
    setUI({ phase: cur.phase, timer: cur.timer, shots: cur.shots, hits: cur.hits });
  }, []);

  // suppress context menu
  const handleContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // reset back to title screen
  const resetGame = useCallback(() => {
    const cur = state.current;
    cur.phase = "title";
    cur.timer = GAME_TIME;
    cur.shots = 0;
    cur.hits = 0;
    setUI({ phase: cur.phase, timer: cur.timer, shots: cur.shots, hits: cur.hits });
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return {
    ui,
    canvasRef,
    handleClick,
    handleContext,
    resetGame,
    startSplash,
    getImg,
    ready,
  };
}
