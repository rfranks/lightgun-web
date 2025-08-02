import { useRef, useState, useEffect, useCallback } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useGameAssets } from "./useGameAssets";
import { useAudio } from "@/hooks/useAudio";
import { rewindAndPlayAudio } from "@/utils/audio";
import { drawTextLabels, newTextLabel } from "@/utils/ui";
import type { GameState, GameUIState, Fish } from "../types";
import type { AssetMgr } from "@/types/ui";
import type { TextLabel } from "@/types/ui";

// Initial timer value (in seconds)
const GAME_TIME = 99;
const FPS = 60; // assumed frame rate for requestAnimationFrame

const FISH_SIZE = 128;
const SKELETON_SPEED = 2;
const SKELETON_CONVERT_DISTANCE = FISH_SIZE / 2;

export default function useZombiefishEngine() {
  // canvas and animation frame refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // assets
  const assetMgr = useGameAssets();
  const { getImg, ready } = assetMgr;
  const killSfx = useAudio("/audio/splash.ogg");

  // window dimensions
  const dims = useWindowSize();

  // main game state stored in a ref so we can mutate without re-render
  const state = useRef<GameState>({
    phase: "title",
    timer: GAME_TIME,
    shots: 0,
    hits: 0,
    accuracy: 0,
    dims,
    fish: [],
    textLabels: [],
  });

  const nextFishId = useRef(1);
  const nextGroupId = useRef(1);
  const frameRef = useRef(0); // track frames for one-second ticks
  const accuracyLabel = useRef<TextLabel | null>(null);
  const finalAccuracy = useRef(0);
  const displayAccuracy = useRef(0);

  // ui state that triggers re-renders
  const [ui, setUI] = useState<GameUIState>({
    phase: "title",
    timer: GAME_TIME,
    shots: 0,
    hits: 0,
    accuracy: 0,
  });

  // sync dims when window size changes
  useEffect(() => {
    state.current.dims = dims;
  }, [dims]);

  const makeText = useCallback(
    (text: string, x: number, y: number) => {
      const lbl = newTextLabel(
        { text, scale: 1, fixed: true, fade: true, x, y },
        { getImg } as unknown as AssetMgr,
        state.current.dims
      );
      state.current.textLabels.push(lbl);
    },
    [getImg]
  );

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

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      animationFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    canvas.width = cur.dims.width;
    canvas.height = cur.dims.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (cur.phase === "playing") {
      updateFish();

      // track frames and decrement the timer once per second
      frameRef.current += 1;
      if (frameRef.current >= FPS) {
        frameRef.current = 0;
        cur.timer = Math.max(0, cur.timer - 1);

        const lbl = cur.textLabels[0];
        if (lbl) {
          const t = cur.timer.toString().padStart(2, "0");
          lbl.text = t;
          const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
          lbl.imgs = t.split("").map((ch) => digitImgs[ch]);
        }

        if (cur.timer === 0) {
          cur.phase = "gameover";
          finalAccuracy.current = Math.round(cur.accuracy);
          displayAccuracy.current = 0;
        }
      }

      // cull fish that have moved completely off-screen
      const { width, height } = cur.dims;
      const margin = FISH_SIZE * 2;
      cur.fish = cur.fish.filter(
        (f) =>
          f.x > -margin &&
          f.x < width + margin &&
          f.y > -margin &&
          f.y < height + margin
      );
    }

    // create/update accuracy label during gameover
    if (cur.phase === "gameover") {
      if (!accuracyLabel.current) {
        const pctImg = getImg("pctImg") as HTMLImageElement;
        const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
        const scale = 1;
        const initImgs = [digitImgs["0"], pctImg];
        const totalWidth = initImgs.reduce(
          (w, img) => w + img.width * scale + 2,
          0
        );
        const lbl = newTextLabel(
          {
            text: "0",
            scale,
            fixed: true,
            fade: false,
            x: (cur.dims.width - totalWidth) / 2,
            y: cur.dims.height / 2,
          },
          assetMgr
        );
        lbl.text = "0%";
        lbl.imgs = initImgs;
        accuracyLabel.current = lbl;
        cur.textLabels.push(lbl);
      } else {
        const lbl = accuracyLabel.current;
        if (displayAccuracy.current < finalAccuracy.current) {
          displayAccuracy.current += 1;
          const pct = Math.min(displayAccuracy.current, finalAccuracy.current);
          const str = pct.toString();
          const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
          const pctImg = getImg("pctImg") as HTMLImageElement;
          lbl.text = `${str}%`;
          lbl.imgs = [...str.split("").map((ch) => digitImgs[ch]), pctImg];
          const totalWidth = lbl.imgs.reduce(
            (w, img) => w + img.width * lbl.scale + 2,
            0
          );
          lbl.x = (cur.dims.width - totalWidth) / 2;
        }
      }
    }

    cur.fish.forEach((f) => {
      const imgMap = getImg(
        f.isSkeleton ? "skeletonImgs" : "fishImgs"
      ) as Record<string, HTMLImageElement>;
      const img = imgMap[f.kind as keyof typeof imgMap];
      if (img) ctx.drawImage(img, f.x, f.y, FISH_SIZE, FISH_SIZE);
    });

    cur.textLabels = drawTextLabels({
      textLabels: cur.textLabels,
      ctx,
      cull: true,
    });

    cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;

    setUI({
      phase: cur.phase,
      timer: cur.timer,
      shots: cur.shots,
      hits: cur.hits,
      accuracy: cur.accuracy,
    });

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [updateFish, getImg, assetMgr]);

  // start the game
  const startSplash = useCallback(() => {
    const cur = state.current;
    cur.phase = "playing";
    cur.timer = GAME_TIME;
    cur.shots = 0;
    cur.hits = 0;
    cur.accuracy = 0;

    frameRef.current = 0;
    accuracyLabel.current = null;
    finalAccuracy.current = 0;
    displayAccuracy.current = 0;
    state.current.textLabels = [
      newTextLabel(
        {
          text: cur.timer.toString().padStart(2, "0"),
          scale: 1,
          fixed: true,
          fade: false,
          x: 16,
          y: 16,
        },
        assetMgr
      ),
    ];
    setUI({ phase: cur.phase, timer: cur.timer, shots: cur.shots, hits: cur.hits, accuracy: cur.accuracy });

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [loop, assetMgr]);

  // handle left click – detect and affect fish
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const cur = state.current;
      if (cur.phase === "gameover") {
        const canvas = canvasRef.current;
        const lbl = accuracyLabel.current;
        if (!canvas || !lbl) return;
        const rect = canvas.getBoundingClientRect();
        const x =
          ((e.clientX - rect.left) / rect.width) * cur.dims.width;
        const y =
          ((e.clientY - rect.top) / rect.height) * cur.dims.height;
        const w = lbl.imgs.reduce(
          (sum, img) => sum + img.width * lbl.scale + 2,
          0
        );
        const h = lbl.imgs.reduce(
          (max, img) => Math.max(max, img.height * lbl.scale),
          0
        );
        if (x >= lbl.x && x <= lbl.x + w && y >= lbl.y && y <= lbl.y + h) {
          resetGame();
        }
        return;
      }

      if (cur.phase !== "playing") return;

      cur.shots += 1;
      const canvas = canvasRef.current;
      if (!canvas) {
        cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;
        setUI({
          phase: cur.phase,
          timer: cur.timer,
          shots: cur.shots,
          hits: cur.hits,
          accuracy: cur.accuracy,
        });
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x =
        ((e.clientX - rect.left) / rect.width) * cur.dims.width;
      const y =
        ((e.clientY - rect.top) / rect.height) * cur.dims.height;

      for (let i = cur.fish.length - 1; i >= 0; i--) {
        const f = cur.fish[i];
        if (
          x >= f.x &&
          x <= f.x + FISH_SIZE &&
          y >= f.y &&
          y <= f.y + FISH_SIZE
        ) {
          cur.hits += 1;
          if (f.kind === "brown") {
            cur.timer += 3 * 60;
            makeText("+3", f.x, f.y);
            cur.fish.splice(i, 1);
            rewindAndPlayAudio(killSfx);
          } else if (f.kind === "grey_long_a" || f.kind === "grey_long_b") {
            cur.timer = Math.max(0, cur.timer - 5 * 60);
            makeText("-5", f.x, f.y);
            const gid = f.groupId;
            cur.fish = cur.fish.filter((fish) => fish.groupId !== gid);
            rewindAndPlayAudio(killSfx);
          } else if (f.isSkeleton) {
            f.health = (f.health ?? 0) - 1;
            if ((f.health ?? 0) <= 0) {
              cur.fish.splice(i, 1);
              rewindAndPlayAudio(killSfx);
            }
          } else {
            f.isSkeleton = true;
            f.health = 1;
          }
          break;
        }
      }

      cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;
      setUI({
        phase: cur.phase,
        timer: cur.timer,
        shots: cur.shots,
        hits: cur.hits,
        accuracy: cur.accuracy,
      });
    },
    [killSfx, makeText, resetGame]
  );

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
    cur.accuracy = 0;
    cur.fish = [];

    state.current.textLabels = [];
    accuracyLabel.current = null;
    finalAccuracy.current = 0;
    displayAccuracy.current = 0;
    frameRef.current = 0;

    setUI({
      phase: cur.phase,
      timer: cur.timer,
      shots: cur.shots,
      hits: cur.hits,
      accuracy: cur.accuracy,
    });
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  // spawn a group of fish just outside the viewport edges
  const spawnFish = useCallback(
    (kind: string, count: number): Fish[] => {
      const spawned: Fish[] = [];
      const { width, height } = state.current.dims;

      const specialSingles = ["brown", "grey_long_a", "grey_long_b"];
      const specialPairs = ["grey_long"];

      if (specialSingles.includes(kind) || specialPairs.includes(kind)) count = 1;

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
          isSkeleton: k === "skeleton",
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
            isSkeleton: false,
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
