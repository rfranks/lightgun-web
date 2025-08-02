import { useRef, useState, useEffect, useCallback } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useGameAssets } from "./useGameAssets";
import type { GameState, GameUIState, Fish } from "../types";

const GAME_TIME = 60 * 30; // 30 seconds in frames

const FISH_SIZE = 128;
const SKELETON_SPEED = 2;
const SKELETON_CONVERT_DISTANCE = FISH_SIZE / 2;

export default function useZombiefishEngine() {
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
    fish: [],
  });

  const nextFishId = useRef(1);
  const nextGroupId = useRef(1);

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

  const updateFish = useCallback(() => {
    const cur = state.current;

    // move all fish
    cur.fish.forEach((f) => {
      f.x += f.vx;
      f.y += f.vy;
    });

    // skeleton behavior
    cur.fish.forEach((s) => {
      if (s.kind !== "skeleton") return;

      let nearest: Fish | undefined;
      let nearestDist = Infinity;

      cur.fish.forEach((t) => {
        if (t.kind === "skeleton") return;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < nearestDist) {
          nearestDist = dist2;
          nearest = t;
        }
      });

      if (nearest) {
        const dx = nearest.x - s.x;
        const dy = nearest.y - s.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          s.vx = (dx / dist) * SKELETON_SPEED;
          s.vy = (dy / dist) * SKELETON_SPEED;
        }
        if (dist < SKELETON_CONVERT_DISTANCE) {
          nearest.kind = "skeleton";
          nearest.health = 2;
          nearest.vx = 0;
          nearest.vy = 0;
          delete nearest.groupId;
        }
      }
    });
  }, []);

  // main loop updates timer and fish
  const loop = useCallback(() => {
    const cur = state.current;
    if (cur.phase !== "playing") return;
    updateFish();
    cur.timer = Math.max(0, cur.timer - 1);
    if (cur.timer === 0) {
      cur.phase = "gameover";
    }
    setUI({ phase: cur.phase, timer: cur.timer, shots: cur.shots, hits: cur.hits });
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [updateFish]);

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
    cur.fish = [];
    setUI({ phase: cur.phase, timer: cur.timer, shots: cur.shots, hits: cur.hits });
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  // spawn a group of fish just outside the viewport edges
  const spawnFish = useCallback(
    (kind: string, count: number): Fish[] => {
      const spawned: Fish[] = [];
      const { width, height } = state.current.dims;

      const specialSingles = ["brown"];
      const specialPairs = ["grey_long"];

      if (specialSingles.includes(kind)) count = 1;

      // decide side and velocity
      const fromLeft = Math.random() < 0.5;
      const baseVx = (Math.random() * 2 + 1) * (fromLeft ? 1 : -1);
      const startX = fromLeft ? -FISH_SIZE : width + FISH_SIZE;

      // helper to create a fish
      const makeFish = (k: string, xOffset = 0, groupId?: number) => {
        const y = Math.random() * height;
        return {
          id: nextFishId.current++,
          kind: k,
          x: startX + xOffset,
          y,
          vx: baseVx,
          vy: 0,
          ...(k === "skeleton" ? { health: 2 } : {}),
          ...(groupId !== undefined ? { groupId } : {}),
        } as Fish;
      };

      if (specialPairs.includes(kind)) {
        const groupId = nextGroupId.current++;
        const pairStart = fromLeft ? -2 * FISH_SIZE : width + 2 * FISH_SIZE;
        const y = Math.random() * height;
        ["grey_long_a", "grey_long_b"].forEach((name, idx) => {
          const x = pairStart + (fromLeft ? idx * FISH_SIZE : -idx * FISH_SIZE);
          spawned.push({
            id: nextFishId.current++,
            kind: name,
            x,
            y,
            vx: baseVx,
            vy: 0,
            groupId,
          });
        });
      } else {
        const groupId = specialSingles.includes(kind)
          ? undefined
          : nextGroupId.current++;
        for (let i = 0; i < count; i++) {
          spawned.push(makeFish(kind, 0, groupId));
        }
      }

      state.current.fish.push(...spawned);
      return spawned;
    },
    []
  );

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
    spawnFish,
  };
}
