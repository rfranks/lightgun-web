import { useRef, useState, useEffect, useCallback } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useGameAssets } from "./useGameAssets";
import { useGameAudio } from "./useGameAudio";
import { drawTextLabels, newTextLabel } from "@/utils/ui";

import type {
  GameState,
  GameUIState,
  Fish,
  Bubble,
  MissParticle,
} from "../types";
import {
  FISH_SPEED_MIN,
  FISH_SPEED_MAX,
  FISH_SPAWN_INTERVAL_MIN,
  FISH_SPAWN_INTERVAL_MAX,
  SKELETON_SPEED,
  MAX_SKELETONS,
  TIME_BONUS_BROWN_FISH,
  TIME_PENALTY_GREY_LONG,
  DEFAULT_CURSOR,
  SHOT_CURSOR,
  TARGET_CURSOR,
} from "../constants";
import type { AssetMgr } from "@/types/ui";
import type { TextLabel } from "@/types/ui";
import type { AudioMgr } from "@/types/audio";
import type { ClickEvent } from "@/types/events";

/* eslint-disable react-hooks/exhaustive-deps */

// Initial timer value (in seconds)
const GAME_TIME = 99;
const FPS = 60; // assumed frame rate for requestAnimationFrame

const FISH_SIZE = 128;
const FISH_FRAME_DELAY = 6;
const MAX_SCHOOL_SIZE = 4;
// limit for how steep fish swim (cross-velocity relative to main)
const MAX_FISH_INCLINE = 0.5;
const SKELETON_CONVERT_DISTANCE = FISH_SIZE / 2;
const SKELETON_REPEL_DISTANCE = FISH_SIZE;
const SKELETON_REPEL_FORCE = 0.05;
const BUBBLE_BASE_SIZE = 64;
const BUBBLE_MIN_SIZE = BUBBLE_BASE_SIZE * 0.5;
const BUBBLE_MAX_SIZE = BUBBLE_BASE_SIZE * 1.5;
const BUBBLE_VX_MAX = 0.5;
const BUBBLE_VY_MIN = -1.5;
const BUBBLE_VY_MAX = -0.5;
const SURFACE_SPEED = [0.05, 0.1];
const ROCK_SPEED = [0.1, 0.2];
const SEAWEED_SPEED = [0.2, 0.4];
const SEAGRASS_SPEED = [0.3, 0.6];
const MAX_BUBBLES = 20;
const HURT_FRAMES = 10;
const CONVERT_FLASH_FRAMES = 5;
const MISS_GROWTH = 4;
const MISS_FADE = 0.05;

const clampIncline = (vx: number, vy: number) => {
  if (Math.abs(vx) >= Math.abs(vy)) {
    const limit = Math.abs(vx) * MAX_FISH_INCLINE;
    return { vx, vy: Math.max(Math.min(vy, limit), -limit) };
  }
  const limit = Math.abs(vy) * MAX_FISH_INCLINE;
  return { vx: Math.max(Math.min(vx, limit), -limit), vy };
};

export default function useGameEngine() {
  // canvas and animation frame refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // assets
  const assetMgr = useGameAssets();
  const { getImg, ready } = assetMgr;
  const audio: AudioMgr = useGameAudio();

  // window dimensions
  const dims = useWindowSize();

  // main game state stored in a ref so we can mutate without re-render
  const state = useRef<GameState>({
    phase: "title",
    timer: GAME_TIME,
    shots: 0,
    hits: 0,
    score: 0,
    accuracy: 0,
    cursor: DEFAULT_CURSOR,
    dims,
    fish: [],
    bubbles: [],
    textLabels: [],
    missParticles: [],
    conversions: 0,
    hitCounts: {},
    warningPlayed: false,
  });

  const nextFishId = useRef(1);
  const nextGroupId = useRef(1);
  const nextPairId = useRef(1);
  const nextBubbleId = useRef(1);
  const inactiveFish = useRef<Fish[]>([]);
  const inactiveBubbles = useRef<Bubble[]>([]);
  const bubbleSpawnRef = useRef(0);
  const spawnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef(0); // track frames for one-second ticks
  const fishSpawnTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surfaceOffsets = useRef<number[]>(SURFACE_SPEED.map(() => 0));
  const rockOffsets = useRef<number[]>(ROCK_SPEED.map(() => 0));
  const seaweedOffsets = useRef<number[]>(SEAWEED_SPEED.map(() => 0));
  const seaGrassOffsets = useRef<number[]>(SEAGRASS_SPEED.map(() => 0));
  const accuracyLabel = useRef<TextLabel | null>(null);
  const finalAccuracy = useRef(0);
  const displayAccuracy = useRef(0);
  const updateBestAccuracy = (score: number) => {
    const best = Number(localStorage.getItem("bestAccuracy") || 0);
    if (score > best) {
      localStorage.setItem("bestAccuracy", score.toString());
    }
  };
  const bestAccuracyLabel = useRef<TextLabel | null>(null);
  const timerLabel = useRef<TextLabel | null>(null);
  const shotsLabel = useRef<TextLabel | null>(null);
  const hitsLabel = useRef<TextLabel | null>(null);
  const scoreLabel = useRef<TextLabel | null>(null);
  const pausedLabel = useRef<TextLabel | null>(null);
  const gameoverShotsLabel = useRef<TextLabel | null>(null);
  const gameoverHitsLabel = useRef<TextLabel | null>(null);
  const gameoverTimeLabel = useRef<TextLabel | null>(null);
  const gameoverScoreLabel = useRef<TextLabel | null>(null);
  const timeTextLabel = useRef<TextLabel | null>(null);
  const timeTextBounds = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // ui state that triggers re-renders
  const [ui, setUI] = useState<GameUIState>({
    phase: "title",
    timer: GAME_TIME,
    shots: 0,
    hits: 0,
    score: 0,
    accuracy: 0,
    cursor: DEFAULT_CURSOR,
  });

  // sync dims when window size changes
  useEffect(() => {
    state.current.dims = dims;
  }, [dims]);

  const syncCursor = useCallback((cursor: string) => {
    state.current.cursor = cursor;
    setUI({
      phase: state.current.phase,
      timer: state.current.timer,
      shots: state.current.shots,
      hits: state.current.hits,
      score: state.current.score,
      accuracy: state.current.accuracy,
      cursor,
    });
  }, []);

  const makeText = useCallback(
    (text: string, x: number, y: number, color?: string) => {
      const lbl = newTextLabel(
        {
          text,
          scale: 1,
          fixed: true,
          fade: true,
          x,
          y,
          vy: -0.5,
          ...(color ? { color } : {}),
        },
        { getImg } as unknown as AssetMgr,
        state.current.dims
      );
      state.current.textLabels.push(lbl);
    },
    [getImg]
  );

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { width, height } = state.current.dims;

      // --- Water ----------------------------------------------------------
      // Tile the base water texture from Terrain/Water across the canvas.
      const waterImgs = getImg("terrainWaterImgs") as
        | Record<string, HTMLImageElement>
        | undefined;
      const water = waterImgs?.water_terrain;
      if (water) {
        for (let x = 0; x < width; x += water.width) {
          for (let y = 0; y < height; y += water.height) {
            ctx.drawImage(water, x, y);
          }
        }
      } else {
        ctx.fillStyle = "#1d8fde";
        ctx.fillRect(0, 0, width, height);
      }

      // --- Surface -------------------------------------------------------
      // Parallax scrolling water surface and clouds.
      const surfaceImgs = getImg("surfaceImgs") as
        | HTMLImageElement[]
        | undefined;
      const cloudImgs = getImg("cloudImgs") as
        | HTMLImageElement[]
        | undefined;
      if (surfaceImgs && surfaceImgs.length) {
        const groupWidth = surfaceImgs[0].width * surfaceImgs.length;
        SURFACE_SPEED.forEach((speed, i) => {
          surfaceOffsets.current[i] -= speed;
          if (surfaceOffsets.current[i] <= -groupWidth)
            surfaceOffsets.current[i] += groupWidth;
        });
        for (let i = 0; i < SURFACE_SPEED.length; i++) {
          const offset = surfaceOffsets.current[i];
          for (let x = -groupWidth; x < width + groupWidth; x += groupWidth) {
            surfaceImgs.forEach((img, idx) => {
              ctx.drawImage(
                img,
                x + offset + idx * surfaceImgs[0].width,
                0
              );
            });
          }
        }
      }
      if (cloudImgs && cloudImgs.length) {
        const groupWidth = cloudImgs[0].width * cloudImgs.length;
        for (let i = 0; i < SURFACE_SPEED.length; i++) {
          const offset = surfaceOffsets.current[i];
          for (let x = -groupWidth; x < width + groupWidth; x += groupWidth) {
            cloudImgs.forEach((img, idx) => {
              ctx.drawImage(
                img,
                x + offset + idx * cloudImgs[0].width,
                0
              );
            });
          }
        }
      }

      // --- Sand -----------------------------------------------------------
      // Lay down the sand terrain and its top edge from Terrain/Sand.
      const sandImgs = getImg("terrainSandImgs") as
        | Record<string, HTMLImageElement>
        | undefined;
      const sand = sandImgs?.terrain_sand_a;
      const sandTop = sandImgs?.terrain_sand_top_a;
      let groundY = height;
      if (sand) {
        groundY = height - sand.height;
        for (let x = 0; x < width; x += sand.width) {
          ctx.drawImage(sand, x, groundY);
        }
      } else {
        groundY = height - 64;
        ctx.fillStyle = "#c2b280";
        ctx.fillRect(0, groundY, width, 64);
      }
      if (sandTop) {
        const y = groundY - sandTop.height;
        for (let x = 0; x < width; x += sandTop.width) {
          ctx.drawImage(sandTop, x, y);
        }
      }

      // --- Seaweed -------------------------------------------------------
      // Parallax scrolling background seaweed from Objects/Seaweed.
      const seaweedBgImgs = getImg("seaweedBgImgs") as
        | HTMLImageElement[]
        | undefined;
      if (seaweedBgImgs && seaweedBgImgs.length) {
        const bottom = groundY;
        const groupWidth = seaweedBgImgs[0].width * seaweedBgImgs.length;
        SEAWEED_SPEED.forEach((speed, i) => {
          seaweedOffsets.current[i] -= speed;
          if (seaweedOffsets.current[i] <= -groupWidth)
            seaweedOffsets.current[i] += groupWidth;
        });
        for (let i = 0; i < SEAWEED_SPEED.length; i++) {
          const offset = seaweedOffsets.current[i];
          for (let x = -groupWidth; x < width + groupWidth; x += groupWidth) {
            seaweedBgImgs.forEach((img, idx) => {
              if (!img) return;
              const y = bottom - img.height;
              ctx.drawImage(img, x + offset + idx * seaweedBgImgs[0].width, y);
            });
          }
        }
      }

      // --- Rocks ---------------------------------------------------------
      // Parallax scrolling background rocks from Objects/Rocks.
      const rockBgImgs = getImg("rockBgImgs") as HTMLImageElement[] | undefined;
      if (rockBgImgs && rockBgImgs.length) {
        const groupWidth = rockBgImgs[0].width * rockBgImgs.length;
        ROCK_SPEED.forEach((speed, i) => {
          rockOffsets.current[i] -= speed;
          if (rockOffsets.current[i] <= -groupWidth)
            rockOffsets.current[i] += groupWidth;
        });
        for (let i = 0; i < ROCK_SPEED.length; i++) {
          const offset = rockOffsets.current[i];
          const y = groundY - rockBgImgs[0].height;
          for (let x = -groupWidth; x < width + groupWidth; x += groupWidth) {
            rockBgImgs.forEach((img, idx) => {
              if (!img) return;
              ctx.drawImage(img, x + offset + idx * rockBgImgs[0].width, y);
            });
          }
        }
      }

      // --- Foreground Sea Grass -----------------------------------------
      // Parallax scrolling foreground sea grass from Objects/SeaGrass.
      const seaGrassImgs = getImg("seaGrassFgImgs") as
        | HTMLImageElement[]
        | undefined;
      if (seaGrassImgs && seaGrassImgs.length) {
        const groupWidth = seaGrassImgs[0].width * seaGrassImgs.length;
        SEAGRASS_SPEED.forEach((speed, i) => {
          seaGrassOffsets.current[i] -= speed;
          if (seaGrassOffsets.current[i] <= -groupWidth)
            seaGrassOffsets.current[i] += groupWidth;
        });
        for (let i = 0; i < SEAGRASS_SPEED.length; i++) {
          const offset = seaGrassOffsets.current[i];
          const y = groundY - seaGrassImgs[0].height;
          for (let x = -groupWidth; x < width + groupWidth; x += groupWidth) {
            seaGrassImgs.forEach((img, idx) => {
              if (!img) return;
              ctx.drawImage(
                img,
                x + offset + idx * seaGrassImgs[0].width,
                y
              );
            });
          }
        }
      }
    },
    [getImg]
  );

  const updateDigitLabel = useCallback(
    (
      label: TextLabel | null,
      value: number,
      pad = 0,
      suffix = ""
    ) => {
      if (!label) return;
      const str =
        (pad > 0 ? value.toString().padStart(pad, "0") : value.toString()) +
        suffix;
      const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
      label.text = str;
      label.imgs = str.split("").map((ch) => digitImgs[ch]);
    },
    [getImg]
  );

  const updateFish = useCallback(() => {
    const cur = state.current;
    const { width, height } = cur.dims;

    // handle conversion flashes
    const flashImg = getImg("fishFlashImg") as HTMLImageElement | undefined;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    cur.fish.forEach((f) => {
      if (f.pendingSkeleton) {
        if (ctx && flashImg) {
          ctx.drawImage(flashImg, f.x, f.y, FISH_SIZE, FISH_SIZE);
        }
        f.flashTimer = (f.flashTimer || 0) - 1;
        if (f.flashTimer <= 0) {
          f.isSkeleton = true;
          f.health = 2;
          f.hurtTimer = 0;
          f.pendingSkeleton = undefined;
          f.flashTimer = undefined;
        }
      }
    });

    // For each group, nudge members toward the group's average velocity.
    const groups: Record<number, { vx: number; vy: number; members: Fish[] }> =
      {};
    cur.fish.forEach((f) => {
      if (f.groupId === undefined) return;
      if (!groups[f.groupId]) {
        groups[f.groupId] = { vx: 0, vy: 0, members: [] };
      }
      const g = groups[f.groupId];
      g.vx += f.vx;
      g.vy += f.vy;
      g.members.push(f);
    });
    Object.values(groups).forEach((g) => {
      const avgVx = g.vx / g.members.length;
      const avgVy = g.vy / g.members.length;
      g.members.forEach((f) => {
        f.vx += (avgVx - f.vx) * 0.05;
        f.vy += (avgVy - f.vy) * 0.05;
      });
    });

    // Keep multi-segment fish aligned. For each pairId, ensure the "b" segment
    // trails the "a" segment at roughly one FISH_SIZE distance.
    const pairs: Record<number, { a?: Fish; b?: Fish }> = {};
    cur.fish.forEach((f) => {
      if (f.pairId === undefined) return;
      const p = (pairs[f.pairId] ||= {});
      if (f.kind === "grey_long_a") p.a = f;
      else if (f.kind === "grey_long_b") p.b = f;
    });
    Object.values(pairs).forEach(({ a, b }) => {
      if (!a || !b) return;
      // synchronize vertical velocity
      b.vy = a.vy;
      // small corrective horizontal velocity to maintain spacing
      const sign = b.x >= a.x ? 1 : -1;
      const desiredX = a.x + FISH_SIZE * sign;
      const dx = desiredX - b.x;
      b.vx += dx * 0.05;
    });

    // skeleton behavior
    const immuneKinds = new Set(["brown", "grey_long_a", "grey_long_b"]);
    const skeletonSpeed = SKELETON_SPEED + cur.conversions * 0.05;
    let skeletonCount = cur.fish.filter((f) => f.isSkeleton).length;
    cur.fish.forEach((s) => {
      if (!s.isSkeleton) return;

      let nearest: Fish | undefined;
      let nearestDist = Infinity;

      cur.fish.forEach((t) => {
        if (t.isSkeleton) return;
        if (t.pendingSkeleton) return;
        if (immuneKinds.has(t.kind)) return;
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
          s.vx = (dx / dist) * skeletonSpeed;
          s.vy = (dy / dist) * skeletonSpeed;
        }
        if (
          dist < SKELETON_CONVERT_DISTANCE &&
          skeletonCount < MAX_SKELETONS &&
          !nearest.pendingSkeleton
        ) {
          // Spawn a brief text effect before converting the fish
          makeText("POOF", nearest.x, nearest.y);
          nearest.pendingSkeleton = true;
          nearest.flashTimer = CONVERT_FLASH_FRAMES;
          nearest.vx = 0;
          nearest.vy = 0;
          nearest.frame = 0;
          nearest.frameCounter = 0;
          delete nearest.groupId;
          cur.conversions += 1;
          audio.play("convert");
          skeletonCount += 1;
        }
      }

    });

    // natural wandering for non-skeleton fish
    cur.fish.forEach((f) => {
      if (f.isSkeleton) return;
      f.wanderTimer -= 1;
      if (f.wanderTimer <= 0) {
        const speed = Math.hypot(f.vx, f.vy) || 0;
        const angle = Math.random() * Math.PI * 2;
        f.vx = Math.cos(angle) * speed;
        f.vy = Math.sin(angle) * speed;
        f.wanderTimer = Math.floor(Math.random() * FPS) + FPS;
      }
    });

    // repel skeletons that get too close to each other
    const skeletons = cur.fish.filter((f) => f.isSkeleton);
    for (let i = 0; i < skeletons.length; i++) {
      const a = skeletons[i];
      for (let j = i + 1; j < skeletons.length; j++) {
        const b = skeletons[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist2 = dx * dx + dy * dy;
        if (
          dist2 < SKELETON_REPEL_DISTANCE * SKELETON_REPEL_DISTANCE &&
          dist2 > 0
        ) {
          const dist = Math.sqrt(dist2);
          const force =
            ((SKELETON_REPEL_DISTANCE - dist) / SKELETON_REPEL_DISTANCE) *
            SKELETON_REPEL_FORCE;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
    }

    // move fish with a slight oscillation and update their angle
    cur.fish.forEach((f) => {
      if (f.hurtTimer > 0) f.hurtTimer -= 1;
      const osc = Math.sin((frameRef.current + f.id) / 20) * 0.5;
      let vx = f.vx;
      let vy = f.vy + osc;
      if (Math.abs(f.vx) >= Math.abs(f.vy)) {
        const limit = Math.abs(f.vx) * MAX_FISH_INCLINE;
        vy = Math.max(Math.min(vy, limit), -limit);
      } else {
        const limit = Math.abs(f.vy) * MAX_FISH_INCLINE;
        vx = Math.max(Math.min(vx, limit), -limit);
      }
      f.x += vx;
      f.y += vy;
      f.angle = Math.atan2(vy, Math.abs(vx));
      if (f.isSkeleton) {
        f.x = Math.max(0, Math.min(f.x, width - FISH_SIZE));
        f.y = Math.max(0, Math.min(f.y, height - FISH_SIZE));
      }
    });
  }, [audio, makeText, getImg]);

  const spawnBubble = useCallback(() => {
    const { width, height } = state.current.dims;
    const kinds = ["bubble_a", "bubble_b", "bubble_c"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const size =
      Math.random() * (BUBBLE_MAX_SIZE - BUBBLE_MIN_SIZE) + BUBBLE_MIN_SIZE;
    const x = Math.random() * (width - size);
    const y = height + size;
    const vx = Math.random() * (BUBBLE_VX_MAX * 2) - BUBBLE_VX_MAX;
    const vy = Math.random() * (BUBBLE_VY_MAX - BUBBLE_VY_MIN) + BUBBLE_VY_MIN;
    const amp = Math.random() * 2 + 0.5;
    const freq = Math.random() * 0.05 + 0.01;
    const bubble = inactiveBubbles.current.pop() || ({} as Bubble);
    bubble.id = nextBubbleId.current++;
    bubble.kind = kind;
    bubble.x = x;
    bubble.y = y;
    bubble.vx = vx;
    bubble.vy = vy;
    bubble.size = size;
    bubble.amp = amp;
    bubble.freq = freq;
    state.current.bubbles.push(bubble);
    if (state.current.bubbles.length > MAX_BUBBLES) {
      const removed = state.current.bubbles.splice(
        0,
        state.current.bubbles.length - MAX_BUBBLES
      );
      inactiveBubbles.current.push(...removed);
    }
  }, []);

  // main loop updates timer and fish
  const loop = useCallback(() => {
    const cur = state.current;

    if (timeTextLabel.current) {
      const lbl = timeTextLabel.current;
      const width = lbl.imgs.reduce(
        (sum, img) =>
          sum + (img ? img.width * lbl.scale + 2 : lbl.spaceGap),
        0
      );
      const height = lbl.imgs.reduce(
        (max, img) =>
          Math.max(max, (img?.height || 0) * lbl.scale),
        0
      );
      timeTextBounds.current = { x: lbl.x, y: lbl.y, width, height };
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      animationFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    if (cur.phase === "playing") {
      updateFish();

      // spawn and animate bubbles
      bubbleSpawnRef.current -= 1;
      if (bubbleSpawnRef.current <= 0) {
        spawnBubble();
        bubbleSpawnRef.current = Math.floor(Math.random() * 60) + 30;
      }
      cur.bubbles.forEach((b) => {
        // Update position using velocity and per-bubble wiggle
        b.x += b.vx + Math.sin(frameRef.current * b.freq) * b.amp;
        b.y += b.vy;
      });
      cur.bubbles = cur.bubbles.filter((b) => {
        const on =
          b.y + b.size > 0 &&
          b.x + b.size > 0 &&
          b.x - b.size < cur.dims.width;
        if (!on) inactiveBubbles.current.push(b);
        return on;
      });

      // track frames and decrement the timer once per second
      frameRef.current += 1;
      if (frameRef.current >= FPS) {
        frameRef.current = 0;
        cur.timer = Math.max(0, cur.timer - 1);
        updateDigitLabel(timerLabel.current, cur.timer, 2, ":");
        if (cur.timer === 10 && !cur.warningPlayed) {
          audio.play("warning");
          cur.warningPlayed = true;
        }
      }

      // check for game over once timer hits zero
      if (cur.timer === 0) {
        cur.phase = "gameover";
        finalAccuracy.current = Math.round(cur.accuracy);
        updateBestAccuracy(finalAccuracy.current);
        displayAccuracy.current = 0;
        audio.pause("bgm");

        // create accuracy label
        const pctImg = getImg("pctImg") as HTMLImageElement;
        const digitImgs = getImg("digitImgs") as Record<
          string,
          HTMLImageElement
        >;
        const scale = 1;
        const initImgs = [digitImgs["0"], pctImg];
        const totalWidth = initImgs.reduce(
          (w, img) => w + img.width * scale + 2,
          0
        );
        const accLbl = newTextLabel(
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
        accLbl.text = "0%";
        accLbl.imgs = initImgs;
        accuracyLabel.current = accLbl;
        cur.textLabels.push(accLbl);

        // create game over stat labels
        const makeStat = (text: string, y: number) => {
          const lbl = newTextLabel(
            { text, scale: 1, fixed: true, fade: false, y },
            assetMgr,
            cur.dims
          );
          cur.textLabels.push(lbl);
          return lbl;
        };

        const baseY = accLbl.y + 40;
        gameoverTimeLabel.current = makeStat(
          `TIME ${cur.timer.toString().padStart(2, "0")}`,
          baseY
        );
        gameoverShotsLabel.current = makeStat(`SHOTS ${cur.shots}`, baseY + 40);
        gameoverHitsLabel.current = makeStat(`HITS ${cur.hits}`, baseY + 80);

        // create a label for each fish type hit
        let y = baseY + 120;
        Object.entries(cur.hitCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([kind, count]) => {
            const text = `${kind.replace(/_/g, " ")} ${count}`;
            makeStat(text, y);
            y += 40;
          });
        gameoverScoreLabel.current = makeStat(`SCORE ${cur.score}`, baseY + 120);
      }
      if (!bestAccuracyLabel.current) {
        const best = Number(localStorage.getItem("bestAccuracy") || 0);
        const pctImg = getImg("pctImg") as HTMLImageElement;
        const digitImgs = getImg("digitImgs") as Record<
          string,
          HTMLImageElement
        >;
        const lbl = newTextLabel(
          {
            text: `${best}%`,
            scale: 1,
            fixed: true,
            fade: false,
            x: 16,
            y: 16,
          },
          assetMgr
        );
        lbl.imgs = [
          ...best
            .toString()
            .split("")
            .map((ch) => digitImgs[ch]),
          pctImg,
        ];
        bestAccuracyLabel.current = lbl;
        cur.textLabels.push(lbl);
      }

      // cull fish that have moved completely off-screen
      const { width, height } = cur.dims;
      const margin = FISH_SIZE * 2;
      cur.fish = cur.fish.filter((f) => {
        const on =
          f.x > -margin &&
          f.x < width + margin &&
          f.y > -margin &&
          f.y < height + margin;
        if (!on) inactiveFish.current.push(f);
        return on;
      });
    }

    // update miss particles
    cur.missParticles.forEach((p) => {
      p.radius += MISS_GROWTH;
      p.alpha -= MISS_FADE;
    });
    cur.missParticles = cur.missParticles.filter((p) => p.alpha > 0);

    // update accuracy label during gameover
    if (cur.phase === "gameover" && accuracyLabel.current) {
      const lbl = accuracyLabel.current;
      if (displayAccuracy.current < finalAccuracy.current) {
        displayAccuracy.current += 1;
        audio.play("tick");
        const pct = Math.min(displayAccuracy.current, finalAccuracy.current);
        const str = pct.toString();
        const digitImgs = getImg("digitImgs") as Record<
          string,
          HTMLImageElement
        >;
        const pctImg = getImg("pctImg") as HTMLImageElement;
        lbl.text = `${str}%`;
        lbl.imgs = [...str.split("").map((ch) => digitImgs[ch]), pctImg];
      }

      // pulse the accuracy label slightly each frame
      lbl.scale = 1 + 0.05 * Math.sin(frameRef.current * 0.1);
      const totalWidth = lbl.imgs.reduce(
        (w, img) => w + (img?.width || 0) * lbl.scale + 2,
        0
      );
      lbl.x = (cur.dims.width - totalWidth) / 2;
    }

    // cull fish that have moved completely off-screen
    if (cur.phase === "playing") {
      const { width, height } = cur.dims;
      const margin = FISH_SIZE * 2;
      cur.fish = cur.fish.filter((f) => {
        const on =
          f.x > -margin &&
          f.x < width + margin &&
          f.y > -margin &&
          f.y < height + margin;
        if (!on) inactiveFish.current.push(f);
        return on;
      });
    }

    if (cur.phase === "paused") {
      if (!pausedLabel.current) {
        pausedLabel.current = newTextLabel(
          { text: "PAUSED", scale: 2, fixed: true, fade: false },
          assetMgr,
          cur.dims
        );
        cur.textLabels.push(pausedLabel.current);
      }
    } else if (pausedLabel.current) {
      cur.textLabels = cur.textLabels.filter((l) => l !== pausedLabel.current);
      pausedLabel.current = null;
    }

    // draw bubbles, fish and text labels
    if (canvas && ctx) {
      canvas.width = cur.dims.width;
      canvas.height = cur.dims.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBackground(ctx);

      // draw timer bar at top of screen
      const barWidth = (cur.timer / GAME_TIME) * canvas.width;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, barWidth, 8);

      const bubbleImgs = getImg("bubbleImgs") as Record<string, HTMLImageElement>;
      cur.bubbles.forEach((b) => {
        const img = bubbleImgs[b.kind as keyof typeof bubbleImgs];
        if (!img) return;
        // scale according to the bubble's size before drawing
        ctx.drawImage(img, b.x, b.y, b.size, b.size);
      });

      cur.missParticles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      cur.fish.forEach((f) => {
        const frameMap = getImg(
          f.isSkeleton ? "skeletonFrames" : "fishFrames"
        ) as Record<string, HTMLImageElement[]>;
        const frames = frameMap[f.kind as keyof typeof frameMap];
        if (!frames || frames.length === 0) return;
        f.frameCounter++;
        if (f.frameCounter >= FISH_FRAME_DELAY) {
          f.frameCounter = 0;
          f.frame = (f.frame + 1) % frames.length;
        }
        const img = frames[f.frame];
        if (!img) return;
        ctx.save();
        let pivotX = f.x + FISH_SIZE / 2;
        const pivotY = f.y + FISH_SIZE / 2;
        let drawX = -FISH_SIZE / 2;
        const drawY = -FISH_SIZE / 2;
        if (f.kind === "grey_long_a" || f.kind === "grey_long_b") {
          pivotX = f.x + (f.kind === "grey_long_a" ? FISH_SIZE : 0);
          drawX = f.kind === "grey_long_a" ? -FISH_SIZE : 0;
        }
        ctx.translate(pivotX, pivotY);
        if (f.vx < 0) ctx.scale(-1, 1);
        ctx.rotate(f.angle);
        if (f.highlight) {
          const fishImgs = getImg("fishImgs") as Record<string, HTMLImageElement>;
          const outline = fishImgs[
            `${f.kind}_outline` as keyof typeof fishImgs
          ];
          if (outline) {
            ctx.globalAlpha = (Math.sin(frameRef.current / 10) + 1) / 2;
            ctx.drawImage(outline, drawX, drawY, FISH_SIZE, FISH_SIZE);
            ctx.globalAlpha = 1;
          }
        }
        ctx.drawImage(img, drawX, drawY, FISH_SIZE, FISH_SIZE);
        if (f.pendingSkeleton) {
          const flash = getImg("fishFlashImg") as HTMLImageElement;
          if (flash) {
            ctx.drawImage(flash, drawX, drawY, FISH_SIZE, FISH_SIZE);
          }
        }
        if (f.isSkeleton && f.hurtTimer > 0) {
          ctx.fillStyle = "rgba(255,0,0,0.5)";
          ctx.fillRect(drawX, drawY, FISH_SIZE, FISH_SIZE);
        }
        ctx.restore();
      });

      cur.textLabels = drawTextLabels({
        textLabels: cur.textLabels,
        ctx,
        cull: true,
      });
    }

    cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;

    setUI({
      phase: cur.phase,
      timer: cur.timer,
      shots: cur.shots,
      hits: cur.hits,
      score: cur.score,
      accuracy: cur.accuracy,
      cursor: cur.cursor,
    });

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [updateFish, getImg, assetMgr, spawnBubble, updateDigitLabel]);

  // start the game
  const startSplash = useCallback(() => {
    const cur = state.current;
    cur.phase = "playing";
    cur.timer = GAME_TIME;
    cur.shots = 0;
    cur.hits = 0;
    cur.score = 0;
    cur.accuracy = 0;
    inactiveFish.current.push(...cur.fish);
    cur.fish = [];
    inactiveBubbles.current.push(...cur.bubbles);
    cur.bubbles = [];
    cur.missParticles = [];
    cur.warningPlayed = false;

    frameRef.current = 0;
    accuracyLabel.current = null;
    bestAccuracyLabel.current = null;
    finalAccuracy.current = 0;
    displayAccuracy.current = 0;
    surfaceOffsets.current.fill(0);
    rockOffsets.current.fill(0);
    seaweedOffsets.current.fill(0);
    seaGrassOffsets.current.fill(0);
    pausedLabel.current = null;
    gameoverShotsLabel.current = null;
    gameoverHitsLabel.current = null;
    gameoverTimeLabel.current = null;
    gameoverScoreLabel.current = null;

    const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
    const digitHeight = digitImgs["0"]?.height || 0;
    const lineHeight = digitHeight + 8;

    audio.play("bgm", { loop: true });

    const labelWidth = (lbl: TextLabel) =>
      lbl.imgs.reduce(
        (sum, img) => sum + (img ? img.width + 2 : lbl.spaceGap),
        0
      );

    const timeText = newTextLabel(
      {
        text: "TIME",
        scale: 1,
        fixed: true,
        fade: false,
        x: 16,
        y: 16,
      },
      assetMgr
    );
    timeTextLabel.current = timeText;
    timeTextBounds.current = {
      x: timeText.x,
      y: timeText.y,
      width: labelWidth(timeText),
      height: timeText.imgs.reduce(
        (max, img) => Math.max(max, (img?.height || 0) * timeText.scale),
        0
      ),
    };

    timerLabel.current = newTextLabel(
      {
        text: `${cur.timer.toString().padStart(2, "0")}:`,
        scale: 1,
        fixed: true,
        fade: false,
        x: 16 + labelWidth(timeText),
        y: 16,
      },
      assetMgr
    );

    const shotsText = newTextLabel(
      {
        text: "SHOTS",
        scale: 1,
        fixed: true,
        fade: false,
        x: 16,
        y: 16 + lineHeight,
      },
      assetMgr
    );
    shotsLabel.current = newTextLabel(
      {
        text: cur.shots.toString(),
        scale: 1,
        fixed: true,
        fade: false,
        x: 16 + labelWidth(shotsText),
        y: 16 + lineHeight,
      },
      assetMgr
    );

    const hitsText = newTextLabel(
      {
        text: "HITS",
        scale: 1,
        fixed: true,
        fade: false,
        x: 16,
        y: 16 + lineHeight * 2,
      },
      assetMgr
    );
    hitsLabel.current = newTextLabel(
      {
        text: cur.hits.toString(),
        scale: 1,
        fixed: true,
        fade: false,
        x: 16 + labelWidth(hitsText),
        y: 16 + lineHeight * 2,
      },
      assetMgr
    );

    const scoreText = newTextLabel(
      {
        text: "SCORE",
        scale: 1,
        fixed: true,
        fade: false,
        x: 16,
        y: 16 + lineHeight * 3,
      },
      assetMgr
    );
    scoreLabel.current = newTextLabel(
      {
        text: cur.score.toString(),
        scale: 1,
        fixed: true,
        fade: false,
        x: 16 + labelWidth(scoreText),
        y: 16 + lineHeight * 3,
      },
      assetMgr
    );
    bubbleSpawnRef.current = 0;

    state.current.textLabels = [
      timeText,
      timerLabel.current!,
      shotsText,
      shotsLabel.current!,
      hitsText,
      hitsLabel.current!,
      scoreText,
      scoreLabel.current!,
    ];
    cur.cursor = DEFAULT_CURSOR;
    setUI({
      phase: cur.phase,
      timer: cur.timer,
      shots: cur.shots,
      hits: cur.hits,
      score: cur.score,
      accuracy: cur.accuracy,
      cursor: cur.cursor,
    });

    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [loop, assetMgr, getImg]);

  // reset back to title screen
  const resetGame = useCallback(() => {
    const cur = state.current;

    if (fishSpawnTimeout.current) {
      clearTimeout(fishSpawnTimeout.current);
      fishSpawnTimeout.current = null;
    }

    cur.phase = "title";
    cur.timer = GAME_TIME;
    cur.shots = 0;
    cur.hits = 0;
    cur.score = 0;
    cur.accuracy = 0;
    cur.conversions = 0;
    cur.hitCounts = {};
    inactiveFish.current.push(...cur.fish);
    cur.fish = [];
    cur.cursor = DEFAULT_CURSOR;
    inactiveBubbles.current.push(...cur.bubbles);
    cur.bubbles = [];
    cur.missParticles = [];
    cur.warningPlayed = false;

    accuracyLabel.current = null;
    bestAccuracyLabel.current = null;
    finalAccuracy.current = 0;
    displayAccuracy.current = 0;
    frameRef.current = 0;
    timerLabel.current = null;
    shotsLabel.current = null;
    hitsLabel.current = null;
    scoreLabel.current = null;
    gameoverShotsLabel.current = null;
    gameoverHitsLabel.current = null;
    gameoverTimeLabel.current = null;
    gameoverScoreLabel.current = null;
    state.current.textLabels = [];
    bubbleSpawnRef.current = 0;
    nextFishId.current = 1;
    nextGroupId.current = 1;
    nextPairId.current = 1;
    nextBubbleId.current = 1;
    surfaceOffsets.current.fill(0);
    rockOffsets.current.fill(0);
    seaweedOffsets.current.fill(0);
    seaGrassOffsets.current.fill(0);
    pausedLabel.current = null;

    setUI({
      phase: cur.phase,
      timer: cur.timer,
      shots: cur.shots,
      hits: cur.hits,
      score: cur.score,
      accuracy: cur.accuracy,
      cursor: cur.cursor,
    });
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
      cursorTimeoutRef.current = null;
    }
    audio.pause("bgm");
    audio.pauseAll();
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const cur = state.current;
      if (
        e.code === "Escape" &&
        (cur.phase === "playing" || cur.phase === "paused")
      ) {
        cur.phase = cur.phase === "playing" ? "paused" : "playing";
        setUI({
          phase: cur.phase,
          timer: cur.timer,
          shots: cur.shots,
          hits: cur.hits,
          score: cur.score,
          accuracy: cur.accuracy,
          cursor: cur.cursor,
        });
        return;
      }
      if (cur.phase === "gameover" && e.code === "Space") {
        resetGame();
        startSplash();
      } else if (state.current.phase === "title") {
        startSplash();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [resetGame, startSplash]);

  // handle mouse move – change cursor when hovering over fish
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const cur = state.current;
      if (cur.phase !== "playing" || cur.cursor === SHOT_CURSOR) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const { left, top, width, height } = canvas.getBoundingClientRect();

      const x = ((e.clientX - left) / width) * cur.dims.width;
      const y = ((e.clientY - top) / height) * cur.dims.height;

      const hovering = cur.fish.some(
        (f) =>
          x >= f.x &&
          x <= f.x + FISH_SIZE &&
          y >= f.y &&
          y <= f.y + FISH_SIZE
      );

      const nextCursor = hovering ? TARGET_CURSOR : DEFAULT_CURSOR;
      if (nextCursor !== cur.cursor) {
        syncCursor(nextCursor);
      }
    },
    [syncCursor]
  );

  // handle left click – detect and affect fish
  const handleClick = useCallback(
    (e: ClickEvent) => {
      e.preventDefault?.();
      const cur = state.current;
      if (cur.phase === "gameover") {
        const canvas = canvasRef.current;
        const lbl = accuracyLabel.current;
        if (!canvas || !lbl) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * cur.dims.width;
        const y = ((e.clientY - rect.top) / rect.height) * cur.dims.height;
        const w = lbl.imgs.reduce(
          (sum, img) => sum + (img?.width || 0) * lbl.scale + 2,
          0
        );
        const h = lbl.imgs.reduce(
          (max, img) => Math.max(max, (img?.height || 0) * lbl.scale),
          0
        );
        if (x >= lbl.x && x <= lbl.x + w && y >= lbl.y && y <= lbl.y + h) {
          resetGame();
        }
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        setUI({
          phase: cur.phase,
          timer: cur.timer,
          shots: cur.shots,
          hits: cur.hits,
          score: cur.score,
          accuracy: cur.accuracy,
          cursor: cur.cursor,
        });
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const canvasX =
        ((e.clientX - rect.left) / rect.width) * cur.dims.width;
      const canvasY =
        ((e.clientY - rect.top) / rect.height) * cur.dims.height;

      const bounds = timeTextBounds.current;
      if (
        canvasX >= bounds.x &&
        canvasX <= bounds.x + bounds.width &&
        canvasY >= bounds.y &&
        canvasY <= bounds.y + bounds.height
      ) {
        if (cur.phase === "playing" || cur.phase === "paused") {
          cur.phase = cur.phase === "playing" ? "paused" : "playing";
          setUI({
            phase: cur.phase,
            timer: cur.timer,
            shots: cur.shots,
            hits: cur.hits,
            score: cur.score,
            accuracy: cur.accuracy,
            cursor: cur.cursor,
          });
        }
        return;
      }

      if (cur.phase !== "playing") return;

      syncCursor(SHOT_CURSOR);
      if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
      cursorTimeoutRef.current = setTimeout(() => {
        syncCursor(DEFAULT_CURSOR);
      }, 100);

      cur.shots += 1;
      updateDigitLabel(shotsLabel.current, cur.shots);
      audio.play("shoot");

      // check bubbles first so they are popped before fish hits
      for (let i = cur.bubbles.length - 1; i >= 0; i--) {
        const b = cur.bubbles[i];
        if (
          canvasX >= b.x &&
          canvasX <= b.x + b.size &&
          canvasY >= b.y &&
          canvasY <= b.y + b.size
        ) {
          const [removedBubble] = cur.bubbles.splice(i, 1);
          if (removedBubble) inactiveBubbles.current.push(removedBubble);
          audio.play("pop");
          cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;
          setUI({
            phase: cur.phase,
            timer: cur.timer,
            shots: cur.shots,
            hits: cur.hits,
            score: cur.score,
            accuracy: cur.accuracy,
            cursor: cur.cursor,
          });
          return;
        }
      }

      // iterate fish in reverse draw order so topmost fish are hit first
      let hit = false;
      for (let i = cur.fish.length - 1; i >= 0; i--) {
        const f = cur.fish[i];
        if (
          canvasX >= f.x &&
          canvasX <= f.x + FISH_SIZE &&
          canvasY >= f.y &&
          canvasY <= f.y + FISH_SIZE
        ) {
          cur.hits += 1;
          cur.hitCounts[f.kind] = (cur.hitCounts[f.kind] || 0) + 1;
          updateDigitLabel(hitsLabel.current, cur.hits);
          audio.play("hit");
          hit = true;
          const scoreMap: Record<string, number> = {
            brown: 50,
            grey_long_a: 5,
            grey_long_b: 5,
          };
          const base = f.isSkeleton ? 20 : scoreMap[f.kind] ?? 10;
          const gain = base + cur.conversions;
          cur.score += gain;
          updateDigitLabel(scoreLabel.current, cur.score);
          if (f.kind === "brown") {
            cur.timer += TIME_BONUS_BROWN_FISH;
            updateDigitLabel(timerLabel.current, cur.timer, 2, ":");
            makeText(`+${TIME_BONUS_BROWN_FISH}`, f.x, f.y, "#ff0");
            const [removed] = cur.fish.splice(i, 1);
            if (removed) inactiveFish.current.push(removed);
            audio.play("bonus");
          } else if (f.kind === "grey_long_a" || f.kind === "grey_long_b") {
            cur.timer = Math.max(0, cur.timer - TIME_PENALTY_GREY_LONG);
            updateDigitLabel(timerLabel.current, cur.timer, 2, ":");
            makeText(`-${TIME_PENALTY_GREY_LONG}`, f.x, f.y);
            const pid = f.pairId;
            if (pid !== undefined) {
              const removed = cur.fish.filter((fish) => fish.pairId === pid);
              cur.fish = cur.fish.filter((fish) => fish.pairId !== pid);
              inactiveFish.current.push(...removed);
            } else {
              const [removed] = cur.fish.splice(i, 1);
              if (removed) inactiveFish.current.push(removed);
            }
            audio.play("penalty");
          } else {
            const skeletonCount = cur.fish.filter(
              (fish) => fish.isSkeleton
            ).length;
            if (!f.isSkeleton) {
              if (Math.random() < 0.5 && skeletonCount < MAX_SKELETONS) {
                f.isSkeleton = true;
                f.health = 1;
                f.hurtTimer = 0;
                f.frame = 0;
                f.frameCounter = 0;
                audio.play("skeleton");
              } else {
                const [removed] = cur.fish.splice(i, 1);
                if (removed) inactiveFish.current.push(removed);
                audio.play("death");
              }
            } else {
              f.health = Math.max(0, f.health - 1);
              if (f.health > 0) {
                f.hurtTimer = HURT_FRAMES;
                audio.play("skeleton");
              } else {
                const [removed] = cur.fish.splice(i, 1);
                if (removed) inactiveFish.current.push(removed);
                audio.play("death");
              }
            }
          }
          break;
        }
      }

      if (!hit) {
        cur.missParticles.push({
          x: canvasX,
          y: canvasY,
          radius: 0,
          alpha: 1,
        } as MissParticle);
      }

      cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;
      setUI({
        phase: cur.phase,
        timer: cur.timer,
        shots: cur.shots,
        hits: cur.hits,
        score: cur.score,
        accuracy: cur.accuracy,
        cursor: cur.cursor,
      });
    },
    [audio, makeText, updateDigitLabel, resetGame]
  );

  // suppress context menu
  const handleContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // factor that ramps up difficulty as time runs out
  const difficultyFactor = () => 1 + (1 - state.current.timer / GAME_TIME);

  // spawn a group of fish just outside the viewport edges
  const spawnFish = useCallback((kind: string, count: number): Fish[] => {
    const spawned: Fish[] = [];
    const { width, height } = state.current.dims;
    // keep school member velocity variance tied to the configured speed range
    const speedVariance = (FISH_SPEED_MAX - FISH_SPEED_MIN) / 4;

    const specialSingles = ["brown", "grey_long_a", "grey_long_b"];
    const specialPairs = ["grey_long"];
    const isSpecial = specialSingles.includes(kind) || specialPairs.includes(kind);

    const reuseFish = () => inactiveFish.current.pop() || ({} as Fish);

    if (isSpecial) count = 1;
    count = Math.min(count, MAX_SCHOOL_SIZE);

    // decide spawning edge
    const edge = Math.floor(Math.random() * 4); // 0:left,1:right,2:top,3:bottom
    const startX = edge === 0 ? -FISH_SIZE : edge === 1 ? width + FISH_SIZE : 0;
    const startY =
      edge === 2 ? -FISH_SIZE : edge === 3 ? height + FISH_SIZE : 0;

    // generate a velocity based on the entry edge
    const genVelocity = () => {
      const factor = difficultyFactor();
      const range = FISH_SPEED_MAX - FISH_SPEED_MIN;
      const main = (Math.random() * range + FISH_SPEED_MIN) * factor;
      const cross = (Math.random() * range - range / 2) * factor;
      let vx: number;
      let vy: number;
      switch (edge) {
        case 0:
          vx = main;
          vy = cross;
          break;
        case 1:
          vx = -main;
          vy = cross;
          break;
        case 2:
          vx = cross;
          vy = main;
          break;
        case 3:
        default:
          vx = cross;
          vy = -main;
          break;
      }
      return clampIncline(vx, vy);
    };

    // helper to create a fish
    const makeFish = (
      k: string,
      x: number,
      y: number,
      groupId?: number,
      highlight = false
    ) => {
      const { vx, vy } = genVelocity();
      const f = reuseFish();
      f.id = nextFishId.current++;
      f.kind = k;
      f.x = x;
      f.y = y;
      f.vx = vx;
      f.vy = vy;
      f.frame = 0;
      f.frameCounter = 0;
      f.angle = 0;
      f.health = k === "skeleton" ? 2 : 0;
      f.hurtTimer = 0;
      f.isSkeleton = k === "skeleton";
      f.groupId = groupId;
      f.pairId = undefined;
      f.highlight = highlight ? true : undefined;
      f.pendingSkeleton = undefined;
      f.flashTimer = undefined;
      f.wanderTimer = Math.floor(Math.random() * FPS) + FPS;
      return f;
    };

    if (specialPairs.includes(kind)) {
      // grey_long spawns as two pieces that move together
      const groupId = nextGroupId.current++;
      const pairId = nextPairId.current++;
      const { vx, vy } = genVelocity(); // keep pair aligned
      if (edge === 0 || edge === 1) {
        const pairStart = edge === 0 ? -2 * FISH_SIZE : width + 2 * FISH_SIZE;
        const y = Math.random() * height;
        ["grey_long_a", "grey_long_b"].forEach((name, idx) => {
          const x =
            pairStart + (edge === 0 ? idx * FISH_SIZE : -idx * FISH_SIZE);
          const f = reuseFish();
          f.id = nextFishId.current++;
          f.kind = name;
          f.x = x;
          f.y = y;
          f.vx = vx;
          f.vy = vy;
          f.angle = 0;
          f.health = kind === "skeleton" ? 2 : 0;
          f.hurtTimer = 0;
          f.isSkeleton = kind === "skeleton";
          f.groupId = groupId;
          f.pairId = pairId;
          f.frame = 0;
          f.frameCounter = 0;
          f.highlight = isSpecial;
          f.pendingSkeleton = undefined;
          f.flashTimer = undefined;
          f.wanderTimer = Math.floor(Math.random() * FPS) + FPS;
          spawned.push(f);
        });
      } else {
        const pairStart = Math.random() * (width - 2 * FISH_SIZE);
        const y = startY;
        ["grey_long_a", "grey_long_b"].forEach((name, idx) => {
          const x = pairStart + idx * FISH_SIZE;
          const f = reuseFish();
          f.id = nextFishId.current++;
          f.kind = name;
          f.x = x;
          f.y = y;
          f.vx = vx;
          f.vy = vy;
          f.angle = 0;
          f.health = kind === "skeleton" ? 2 : 0;
          f.hurtTimer = 0;
          f.isSkeleton = kind === "skeleton";
          f.groupId = groupId;
          f.pairId = pairId;
          f.frame = 0;
          f.frameCounter = 0;
          f.highlight = isSpecial;
          f.pendingSkeleton = undefined;
          f.flashTimer = undefined;
          f.wanderTimer = Math.floor(Math.random() * FPS) + FPS;
          spawned.push(f);
        });
      }
    } else {
      const groupId = specialSingles.includes(kind)
        ? undefined
        : nextGroupId.current++;
      const x =
        edge === 0 ? startX : edge === 1 ? startX : Math.random() * width;
      const y =
        edge === 2 ? startY : edge === 3 ? startY : Math.random() * height;

      if (groupId === undefined) {
        for (let i = 0; i < count; i++) {
          spawned.push(makeFish(kind, x, y, groupId, isSpecial));
        }
      } else {
        const leader = makeFish(kind, x, y, groupId, isSpecial);
        spawned.push(leader);
        const existingPositions: Fish[] = [...state.current.fish, leader];
        const overlaps = (nx: number, ny: number) =>
          existingPositions.some(
            (f) =>
              Math.abs(f.x - nx) < FISH_SIZE && Math.abs(f.y - ny) < FISH_SIZE
          );
        for (let i = 1; i < count; i++) {
          const member = makeFish(kind, leader.x, leader.y, groupId);
          let mx = leader.x + (Math.random() - 0.5) * FISH_SIZE;
          const my = Math.min(
            Math.max(leader.y + (Math.random() - 0.5) * FISH_SIZE, 0),
            height
          );
          let attempts = 0;
          while (overlaps(mx, my) && attempts < 10) {
            mx += FISH_SIZE;
            attempts++;
          }
          member.x = Math.min(Math.max(mx, 0), width - FISH_SIZE);
          member.y = my;
          member.vx = leader.vx + (Math.random() - 0.5) * speedVariance;
          member.vy = leader.vy + (Math.random() - 0.5) * speedVariance;
          const limited = clampIncline(member.vx, member.vy);
          member.vx = limited.vx;
          member.vy = limited.vy;
          spawned.push(member);
          existingPositions.push(member);
        }

        // repulsion loop to ensure group members don't overlap
        const groupMembers = spawned.filter((f) => f.groupId === groupId);
        for (let iter = 0; iter < 5; iter++) {
          for (let i = 0; i < groupMembers.length; i++) {
            for (let j = i + 1; j < groupMembers.length; j++) {
              const a = groupMembers[i];
              const b = groupMembers[j];
              if (
                Math.abs(a.x - b.x) < FISH_SIZE &&
                Math.abs(a.y - b.y) < FISH_SIZE
              ) {
                const overlapX = FISH_SIZE - Math.abs(a.x - b.x);
                const overlapY = FISH_SIZE - Math.abs(a.y - b.y);
                const dirX = a.x < b.x ? -1 : 1;
                const dirY = a.y < b.y ? -1 : 1;
                a.x += (dirX * overlapX) / 2;
                b.x -= (dirX * overlapX) / 2;
                a.y += (dirY * overlapY) / 2;
                b.y -= (dirY * overlapY) / 2;
                a.x = Math.min(Math.max(a.x, 0), width - FISH_SIZE);
                b.x = Math.min(Math.max(b.x, 0), width - FISH_SIZE);
                a.y = Math.min(Math.max(a.y, 0), height - FISH_SIZE);
                b.y = Math.min(Math.max(b.y, 0), height - FISH_SIZE);
              }
            }
          }
        }
      }
    }

    state.current.fish.push(...spawned);
    return spawned;
  }, []);

  // spawn scheduler
  useEffect(() => {
    if (ui.phase !== "playing") return;
    const basicKinds = ["blue", "green", "orange", "pink", "red"];
    const schedule = () => {
      const { timer, conversions } = state.current;
      const difficultyFactor =
        1 + (1 - timer / GAME_TIME) + conversions * 0.1;
      // FISH_SPAWN_INTERVAL_* are expressed in frames; convert to ms
      const min = (FISH_SPAWN_INTERVAL_MIN / FPS) * 1000;
      const max = (FISH_SPAWN_INTERVAL_MAX / FPS) * 1000;
      const baseDelay = min + Math.random() * (max - min);
      const delay = Math.max(baseDelay / difficultyFactor, 250);

      fishSpawnTimeout.current = setTimeout(() => {
        if (state.current.phase !== "playing") return;
        const roll = Math.random();
        if (roll < 0.1) {
          spawnFish("brown", 1);
        } else if (roll < 0.15) {
          spawnFish("grey_long", 1);
        } else {
          const kind =
            basicKinds[Math.floor(Math.random() * basicKinds.length)];
          const count = Math.floor(Math.random() * 5) + 1;
          spawnFish(kind, count);
        }
        if (state.current.phase === "playing") schedule();
      }, delay);
    };
    schedule();
    return () => {
      if (fishSpawnTimeout.current) {
        clearTimeout(fishSpawnTimeout.current);
        fishSpawnTimeout.current = null;
      }
    };
  }, [ui.phase, spawnFish]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return {
    ui,
    canvasRef,
    handleMouseMove,
    handleClick,
    handleContext,
    resetGame,
    startSplash,
    getImg,
    ready,
    spawnFish,
  };
}
