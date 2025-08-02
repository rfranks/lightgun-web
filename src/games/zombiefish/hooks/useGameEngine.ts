import { useRef, useState, useEffect, useCallback } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useGameAssets } from "./useGameAssets";
import { useGameAudio } from "./useGameAudio";
import { drawTextLabels, newTextLabel } from "@/utils/ui";

import type { GameState, GameUIState, Fish, Bubble } from "../types";
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

/* eslint-disable react-hooks/exhaustive-deps */

// Initial timer value (in seconds)
const GAME_TIME = 99;
const FPS = 60; // assumed frame rate for requestAnimationFrame

const FISH_SIZE = 128;
const FISH_FRAME_DELAY = 6;
const MAX_SCHOOL_SIZE = 4;
const SKELETON_CONVERT_DISTANCE = FISH_SIZE / 2;
const BUBBLE_BASE_SIZE = 64;
const BUBBLE_MIN_SIZE = BUBBLE_BASE_SIZE * 0.5;
const BUBBLE_MAX_SIZE = BUBBLE_BASE_SIZE * 1.5;
const BUBBLE_VX_MAX = 0.5;
const BUBBLE_VY_MIN = -1.5;
const BUBBLE_VY_MAX = -0.5;
const ROCK_SPEED = 0.2;
const SEAWEED_SPEED = 0.4;
const BUBBLE_SIZE = BUBBLE_BASE_SIZE;
const ROCK_SPEED = [0.1, 0.2];
const SEAWEED_SPEED = [0.2, 0.4];
const MAX_BUBBLES = 20;
const HURT_FRAMES = 10;
const CONVERT_FLASH_FRAMES = 5;

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
    accuracy: 0,
    cursor: DEFAULT_CURSOR,
    dims,
    fish: [],
    bubbles: [],
    textLabels: [],
    conversions: 0,
  });

  const nextFishId = useRef(1);
  const nextGroupId = useRef(1);
  const nextBubbleId = useRef(1);
  const bubbleSpawnRef = useRef(0);
  const frameRef = useRef(0); // track frames for one-second ticks
  const fishSpawnTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rockOffsets = useRef<number[]>(ROCK_SPEED.map(() => 0));
  const seaweedOffsets = useRef<number[]>(SEAWEED_SPEED.map(() => 0));
  const accuracyLabel = useRef<TextLabel | null>(null);
  const finalAccuracy = useRef(0);
  const displayAccuracy = useRef(0);
  const timerLabel = useRef<TextLabel | null>(null);
  const shotsLabel = useRef<TextLabel | null>(null);
  const hitsLabel = useRef<TextLabel | null>(null);
  const pausedLabel = useRef<TextLabel | null>(null);
  const gameoverShotsLabel = useRef<TextLabel | null>(null);
  const gameoverHitsLabel = useRef<TextLabel | null>(null);
  const gameoverTimeLabel = useRef<TextLabel | null>(null);

  // ui state that triggers re-renders
  const [ui, setUI] = useState<GameUIState>({
    phase: "title",
    timer: GAME_TIME,
    shots: 0,
    hits: 0,
    accuracy: 0,
    cursor: DEFAULT_CURSOR,
  });

  // sync dims when window size changes
  useEffect(() => {
    state.current.dims = dims;
  }, [dims]);

  const makeText = useCallback(
    (text: string, x: number, y: number) => {
      const lbl = newTextLabel(
        { text, scale: 1, fixed: true, fade: true, x, y, vy: -0.5 },
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
      ROCK_SPEED.forEach((s, i) => {
        rockOffsets.current[i] -= s;
        if (rockOffsets.current[i] <= -width)
          rockOffsets.current[i] += width;
      });
      SEAWEED_SPEED.forEach((s, i) => {
        seaweedOffsets.current[i] -= s;
        if (seaweedOffsets.current[i] <= -width)
          seaweedOffsets.current[i] += width;
      });

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

      const rockBgImgs = getImg("rockBgImgs") as
        | HTMLImageElement[]
        | undefined;
      if (rockBgImgs) {
        const rockLayers = [
          [
            { img: rockBgImgs[0], x: width * 0.1 },
            { img: rockBgImgs[1], x: width * 0.7 },
          ],
          [
            { img: rockBgImgs[1], x: width * 0.3 },
            { img: rockBgImgs[0], x: width * 0.9 },
          ],
        ];
        rockLayers.forEach((layer, i) => {
          layer.forEach(({ img, x }) => {
            if (!img) return;
            const y = groundY - img.height;
            const drawX = x + rockOffsets.current[i];
            ctx.drawImage(img, drawX, y);
            ctx.drawImage(img, drawX + width, y);
          });
        });
      }

      const seaweedBgImgs = getImg("seaweedBgImgs") as
        | HTMLImageElement[]
        | undefined;
      if (seaweedBgImgs) {
        const bottom = groundY;
        const seaweedLayers = [
          [
            { img: seaweedBgImgs[0], x: width * 0.2 },
            { img: seaweedBgImgs[2], x: width * 0.5 },
            { img: seaweedBgImgs[4], x: width * 0.8 },
          ],
          [
            { img: seaweedBgImgs[1], x: width * 0.1 },
            { img: seaweedBgImgs[3], x: width * 0.4 },
            { img: seaweedBgImgs[5], x: width * 0.7 },
          ],
        ];
        seaweedLayers.forEach((layer, i) => {
          layer.forEach(({ img, x }) => {
            if (!img) return;
            const y = bottom - img.height;
            const drawX = x + seaweedOffsets.current[i];
            ctx.drawImage(img, drawX, y);
            ctx.drawImage(img, drawX + width, y);
          });
        });
      }
    },
    [getImg]
  );

  const updateDigitLabel = useCallback(
    (label: TextLabel | null, value: number, pad = 0) => {
      if (!label) return;
      const str = pad > 0 ? value.toString().padStart(pad, "0") : value.toString();
      const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
      label.text = str;
      label.imgs = str.split("").map((ch) => digitImgs[ch]);
    },
    [getImg]
  );

  const updateFish = useCallback(() => {
    const cur = state.current;

    // handle conversion flashes
    cur.fish.forEach((f) => {
      if (f.pendingSkeleton) {
        f.flashTimer = (f.flashTimer || 0) - 1;
        if (f.flashTimer <= 0) {
          f.isSkeleton = true;
          f.health = 2;
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

    // skeleton behavior
    const immuneKinds = new Set(["brown", "grey_long_a", "grey_long_b"]);
    const speedMult = 1 + cur.conversions * 0.1;
    const base = SKELETON_SPEED * speedMult;
    const extra = SKELETON_SPEED * speedMult;
    const skeletonSpeed = base + (1 - cur.timer / GAME_TIME) * extra;
    let skeletonCount = cur.fish.filter((f) => f.isSkeleton).length;
    cur.fish.forEach((s) => {
      if (!s.isSkeleton) return;

      let nearest: Fish | undefined;
      let nearestDist = Infinity;

      cur.fish.forEach((t) => {
        if (t.isSkeleton) return;
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
          !immuneKinds.has(nearest.kind) &&
          skeletonCount < MAX_SKELETONS
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

      // steer skeletons back onto the playfield if they hit an edge
      const { width, height } = cur.dims;
      if (s.x < 0) s.vx = Math.abs(s.vx) || skeletonSpeed;
      else if (s.x + FISH_SIZE > width) s.vx = -Math.abs(s.vx) || -skeletonSpeed;
      if (s.y < 0) s.vy = Math.abs(s.vy) || skeletonSpeed;
      else if (s.y + FISH_SIZE > height) s.vy = -Math.abs(s.vy) || -skeletonSpeed;
    });

    // move fish with a slight oscillation and update their angle
    cur.fish.forEach((f) => {
      if (f.hurtTimer && f.hurtTimer > 0) f.hurtTimer -= 1;
      const osc = Math.sin((frameRef.current + f.id) / 20) * 0.5;
      const vy = f.vy + osc;
      f.x += f.vx;
      f.y += vy;
      f.angle = Math.atan2(vy, Math.abs(f.vx));
    });
  }, [audio, makeText]);

  const spawnBubble = useCallback(() => {
    const { width, height } = state.current.dims;
    const kinds = ["bubble_a", "bubble_b", "bubble_c"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const size =
      Math.random() * (BUBBLE_MAX_SIZE - BUBBLE_MIN_SIZE) + BUBBLE_MIN_SIZE;
    const x = Math.random() * (width - size);
    const y = height + size;
    const vx = Math.random() * (BUBBLE_VX_MAX * 2) - BUBBLE_VX_MAX;
    const vy =
      Math.random() * (BUBBLE_VY_MAX - BUBBLE_VY_MIN) + BUBBLE_VY_MIN;
    state.current.bubbles.push({
      id: nextBubbleId.current++,
      kind,
      x,
      y,
      vx,
      vy,
      size,
    } as Bubble);
    if (state.current.bubbles.length > MAX_BUBBLES) {
      state.current.bubbles = state.current.bubbles.slice(-MAX_BUBBLES);
    }
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

    if (cur.phase === "playing") {
      updateFish();

      // spawn and animate bubbles
      bubbleSpawnRef.current -= 1;
      if (bubbleSpawnRef.current <= 0) {
        spawnBubble();
        cur.bubbles = cur.bubbles.slice(-MAX_BUBBLES);
        bubbleSpawnRef.current = Math.floor(Math.random() * 60) + 30;
      }
      cur.bubbles.forEach((b) => {
        // Update position using each bubble's velocity
        b.x += b.vx;
        b.y += b.vy;
      });
      cur.bubbles = cur.bubbles.filter((b) => b.y + b.size > 0);

      // track frames and decrement the timer once per second
      frameRef.current += 1;
      if (frameRef.current >= FPS) {
        frameRef.current = 0;
        cur.timer = Math.max(0, cur.timer - 1);
        updateDigitLabel(timerLabel.current, cur.timer, 2);

        if (cur.timer === 0) {
          cur.phase = "gameover";
          finalAccuracy.current = Math.round(cur.accuracy);
          const best = Number(localStorage.bestAccuracy || 0);
          if (finalAccuracy.current > best) {
            localStorage.bestAccuracy = finalAccuracy.current.toString();
          }
          displayAccuracy.current = 0;
          audio.pause("bgm");
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
        const lbl = newTextLabel(
          {
            text: "0",
            scale,
            fixed: true,
            fade: false,
            x: (cur.dims.width - totalWidth) / 2,
            y: cur.dims.height / 2,
            onClick: () => {
              resetGame();
              startSplash();
            },
          },
          assetMgr
        );
        lbl.text = "0%";
        lbl.imgs = initImgs;
        accuracyLabel.current = lbl;
        cur.textLabels.push(lbl);
      }

      const lbl = accuracyLabel.current!;
      if (displayAccuracy.current < finalAccuracy.current) {
        displayAccuracy.current += 1;
        audio.play("tick");
        const pct = Math.min(displayAccuracy.current, finalAccuracy.current);
        const str = pct.toString();
        const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
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

    drawBackground(ctx);

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
      ctx.translate(f.x + FISH_SIZE / 2, f.y + FISH_SIZE / 2);
      if (f.vx < 0) ctx.scale(-1, 1);
      ctx.rotate(f.angle);
      ctx.drawImage(img, -FISH_SIZE / 2, -FISH_SIZE / 2, FISH_SIZE, FISH_SIZE);
      if (f.hurtTimer && f.hurtTimer > 0) {
        ctx.fillStyle = "rgba(255,0,0,0.5)";
        ctx.fillRect(-FISH_SIZE / 2, -FISH_SIZE / 2, FISH_SIZE, FISH_SIZE);
      } else if (f.flashTimer && f.flashTimer > 0) {
        const overlay = getImg("fishFlashImg") as HTMLImageElement;
        if (overlay) {
          ctx.globalAlpha = f.flashTimer / CONVERT_FLASH_FRAMES;
          ctx.drawImage(
            overlay,
            -FISH_SIZE / 2,
            -FISH_SIZE / 2,
            FISH_SIZE,
            FISH_SIZE
          );
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    });

    cur.textLabels = drawTextLabels({
      textLabels: cur.textLabels,
      ctx,
      cull: true,
    });

      // cull fish that have moved completely off-screen
      if (cur.phase === "playing") {
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


      if (cur.phase === "paused") {
        if (!pausedLabel.current) {
          pausedLabel.current = newTextLabel(
            { text: "PAUSED", scale: 2, fixed: true, fade: false },
            assetMgr,
            cur.dims
          );
          cur.textLabels.push(pausedLabel.current);
        }
      } 
    (pausedLabel.current) {
        cur.textLabels = cur.textLabels.filter((l) => l !== pausedLabel.current);
        pausedLabel.current = null;
      }

      // draw bubbles, fish and text labels
      if (canvas && ctx) {
        canvas.width = cur.dims.width;
        canvas.height = cur.dims.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBackground(ctx);

      const bubbleImgs = getImg("bubbleImgs") as Record<string, HTMLImageElement>;
      cur.bubbles.forEach((b) => {
        const img = bubbleImgs[b.kind as keyof typeof bubbleImgs];
        if (!img) return;
        // scale according to the bubble's size before drawing
        ctx.drawImage(img, b.x, b.y, b.size, b.size);
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
        ctx.translate(f.x + FISH_SIZE / 2, f.y + FISH_SIZE / 2);
        if (f.vx < 0) ctx.scale(-1, 1);
        ctx.rotate(f.angle);
        ctx.drawImage(
          img,
          -FISH_SIZE / 2,
          -FISH_SIZE / 2,
          FISH_SIZE,
          FISH_SIZE
        );
        if (f.hurtTimer && f.hurtTimer > 0) {
          ctx.fillStyle = "rgba(255,0,0,0.5)";
          ctx.fillRect(-FISH_SIZE / 2, -FISH_SIZE / 2, FISH_SIZE, FISH_SIZE);
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
    cur.accuracy = 0;
    cur.bubbles = [];

    frameRef.current = 0;
    accuracyLabel.current = null;
    finalAccuracy.current = 0;
    displayAccuracy.current = 0;
    rockOffsets.current.fill(0);
    seaweedOffsets.current.fill(0);
    pausedLabel.current = null;

    const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
    const digitHeight = digitImgs["0"]?.height || 0;
    const lineHeight = digitHeight + 8;

    audio.play("bgm");

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

    timerLabel.current = newTextLabel(
      {
        text: cur.timer.toString().padStart(2, "0"),
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
    bubbleSpawnRef.current = 0;

    state.current.textLabels = [
      timeText,
      timerLabel.current!,
      shotsText,
      shotsLabel.current!,
      hitsText,
      hitsLabel.current!,
    ];
    cur.cursor = DEFAULT_CURSOR;
    setUI({
      phase: cur.phase,
      timer: cur.timer,
      shots: cur.shots,
      hits: cur.hits,
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
    cur.accuracy = 0;
    cur.conversions = 0;
    cur.fish = [];
    cur.cursor = DEFAULT_CURSOR;
    cur.bubbles = [];

    accuracyLabel.current = null;
    finalAccuracy.current = 0;
    displayAccuracy.current = 0;
    frameRef.current = 0;
    timerLabel.current = null;
    shotsLabel.current = null;
    hitsLabel.current = null;
    gameoverShotsLabel.current = null;
    gameoverHitsLabel.current = null;
    gameoverTimeLabel.current = null;
    state.current.textLabels = [];
    bubbleSpawnRef.current = 0;
    rockOffsets.current.fill(0);
    seaweedOffsets.current.fill(0);
    pausedLabel.current = null;

    setUI({
      phase: cur.phase,
      timer: cur.timer,
      shots: cur.shots,
      hits: cur.hits,
      accuracy: cur.accuracy,
      cursor: cur.cursor,
    });
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    audio.pause("bgm");
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const cur = state.current;
      if (e.code === "Escape" && (cur.phase === "playing" || cur.phase === "paused")) {
        cur.phase = cur.phase === "playing" ? "paused" : "playing";
        setUI({
          phase: cur.phase,
          timer: cur.timer,
          shots: cur.shots,
          hits: cur.hits,
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
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * cur.dims.width;
      const y = ((e.clientY - rect.top) / rect.height) * cur.dims.height;
      const hovering = cur.fish.some(
        (f) =>
          x >= f.x &&
          x <= f.x + FISH_SIZE &&
          y >= f.y &&
          y <= f.y + FISH_SIZE
      );
      const nextCursor = hovering ? TARGET_CURSOR : DEFAULT_CURSOR;
      if (cur.cursor !== nextCursor) {
        cur.cursor = nextCursor;
        setUI({
          phase: cur.phase,
          timer: cur.timer,
          shots: cur.shots,
          hits: cur.hits,
          accuracy: cur.accuracy,
          cursor: cur.cursor,
        });
      }
    },
    []
  );

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
        const x = ((e.clientX - rect.left) / rect.width) * cur.dims.width;
        const y = ((e.clientY - rect.top) / rect.height) * cur.dims.height;
        const w = lbl.imgs.reduce(
          (sum, img) => sum + (img?.width || 0) * lbl.scale + 2,
          0
        );
        const h = lbl.imgs.reduce(
          (max, img) => Math.max(max, (img?.height || 0) * lbl.scale || 0),
          0
        );
        if (x >= lbl.x && x <= lbl.x + w && y >= lbl.y && y <= lbl.y + h) {
          lbl.onClick?.();
        }
        return;
      }

      if (cur.phase !== "playing") return;

      cur.cursor = SHOT_CURSOR;
      setTimeout(() => {
        state.current.cursor = DEFAULT_CURSOR;
        setUI({
          phase: state.current.phase,
          timer: state.current.timer,
          shots: state.current.shots,
          hits: state.current.hits,
          accuracy: state.current.accuracy,
          cursor: state.current.cursor,
        });
      }, 100);

      cur.shots += 1;
      updateDigitLabel(shotsLabel.current, cur.shots);
      audio.play("shoot");
      const canvas = canvasRef.current;
      if (!canvas) {
        cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;
        setUI({
          phase: cur.phase,
          timer: cur.timer,
          shots: cur.shots,
          hits: cur.hits,
          accuracy: cur.accuracy,
          cursor: cur.cursor,
        });
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * cur.dims.width;
      const y = ((e.clientY - rect.top) / rect.height) * cur.dims.height;

      for (let i = cur.fish.length - 1; i >= 0; i--) {
        const f = cur.fish[i];
        if (
          x >= f.x &&
          x <= f.x + FISH_SIZE &&
          y >= f.y &&
          y <= f.y + FISH_SIZE
        ) {
          cur.hits += 1;
          updateDigitLabel(hitsLabel.current, cur.hits);
          if (f.kind === "brown") {
            cur.timer += TIME_BONUS_BROWN_FISH;
            updateDigitLabel(timerLabel.current, cur.timer, 2);
            makeText(`+${TIME_BONUS_BROWN_FISH}`, f.x, f.y);
            cur.fish.splice(i, 1);
            audio.play("bonus");
          } else if (f.kind === "grey_long_a" || f.kind === "grey_long_b") {
            cur.timer = Math.max(
              0,
              cur.timer - TIME_PENALTY_GREY_LONG
            );
            updateDigitLabel(timerLabel.current, cur.timer, 2);
            makeText(`-${TIME_PENALTY_GREY_LONG}`, f.x, f.y);
            const gid = f.groupId;
            cur.fish = cur.fish.filter((fish) => fish.groupId !== gid);
            audio.play("penalty");
          } else {
            const skeletonCount = cur.fish.filter((fish) => fish.isSkeleton).length;
            if (!f.isSkeleton) {
              if (Math.random() < 0.5 && skeletonCount < MAX_SKELETONS) {
                f.isSkeleton = true;
                f.health = 1;
                f.frame = 0;
                f.frameCounter = 0;
                audio.play("skeleton");
              } else {
                cur.fish.splice(i, 1);
                audio.play("death");
              }
            } else {
              f.health = (f.health ?? 0) - 1;
              if ((f.health ?? 0) <= 0) {
                cur.fish.splice(i, 1);
                audio.play("death");
              } else {
                f.hurtTimer = HURT_FRAMES;
                audio.play("skeleton");
              }
            }
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
        cursor: cur.cursor,
      });
    },
    [audio, makeText, updateDigitLabel]
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

    const specialSingles = ["brown", "grey_long_a", "grey_long_b"];
    const specialPairs = ["grey_long"];

    if (specialSingles.includes(kind) || specialPairs.includes(kind)) count = 1;
    count = Math.min(count, MAX_SCHOOL_SIZE);

    // decide spawning edge
    const edge = Math.floor(Math.random() * 4); // 0:left,1:right,2:top,3:bottom
    const startX =
      edge === 0 ? -FISH_SIZE : edge === 1 ? width + FISH_SIZE : 0;
    const startY =
      edge === 2 ? -FISH_SIZE : edge === 3 ? height + FISH_SIZE : 0;

    // generate a velocity based on the entry edge
    const genVelocity = () => {
      const factor = difficultyFactor();
      const range = FISH_SPEED_MAX - FISH_SPEED_MIN;
      const main =
        (Math.random() * range + FISH_SPEED_MIN) * factor;
      const cross =
        (Math.random() * range - range / 2) * factor;
      switch (edge) {
        case 0:
          return { vx: main, vy: cross };
        case 1:
          return { vx: -main, vy: cross };
        case 2:
          return { vx: cross, vy: main };
        case 3:
        default:
          return { vx: cross, vy: -main };
      }
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
      return {
        id: nextFishId.current++,
        kind: k,
        x,
        y,
        vx,
        vy,
        frame: 0,
        frameCounter: 0,
        ...(k === "skeleton" ? { health: 2 } : {}),
        isSkeleton: k === "skeleton",
        ...(groupId !== undefined ? { groupId } : {}),
        ...(highlight ? { highlight: true } : {}),
      } as Fish;
    };

    if (specialPairs.includes(kind)) {
      const groupId = nextGroupId.current++;
      const { vx, vy } = genVelocity(); // keep pair aligned
      if (edge === 0 || edge === 1) {
        const pairStart = edge === 0 ? -2 * FISH_SIZE : width + 2 * FISH_SIZE;
        const y = Math.random() * height;
        ["grey_long_a", "grey_long_b"].forEach((name, idx) => {
          const x = pairStart + (edge === 0 ? idx * FISH_SIZE : -idx * FISH_SIZE);
          spawned.push({
            id: nextFishId.current++,
            kind: name,
            x,
            y,
            vx,
            vy,
            angle: 0,
            groupId,
            ...(kind === "skeleton" ? { health: 2 } : {}),
            isSkeleton: kind === "skeleton",
            ...(groupId !== undefined ? { groupId } : {}),
            frame: 0,
            frameCounter: 0,
            highlight: true,
          } as Fish);
        });
      } else {
        const pairStart = Math.random() * (width - 2 * FISH_SIZE);
        const y = startY;
        ["grey_long_a", "grey_long_b"].forEach((name, idx) => {
          const x = pairStart + idx * FISH_SIZE;
          spawned.push({
            id: nextFishId.current++,
            kind: name,
            x,
            y,
            vx,
            vy,
            angle: 0,
            groupId,
            ...(kind === "skeleton" ? { health: 2 } : {}),
            isSkeleton: kind === "skeleton",
            ...(groupId !== undefined ? { groupId } : {}),
            frame: 0,
            frameCounter: 0,
            highlight: true,
          } as Fish);
        });
      }
    } else {
      const groupId = specialSingles.includes(kind)
        ? undefined
        : nextGroupId.current++;
      const x =
        edge === 0
          ? startX
          : edge === 1
          ? startX
          : Math.random() * width;
      const y =
        edge === 2
          ? startY
          : edge === 3
          ? startY
          : Math.random() * height;

      if (groupId === undefined) {
        for (let i = 0; i < count; i++) {
          spawned.push(
            makeFish(kind, x, y, groupId, specialSingles.includes(kind))
          );
        }
      } else {
        const leader = makeFish(
          kind,
          x,
          y,
          groupId,
          specialSingles.includes(kind)
        );
        spawned.push(leader);
        const existingPositions: Fish[] = [...state.current.fish, leader];
        const overlaps = (nx: number, ny: number) =>
          existingPositions.some(
            (f) =>
              Math.abs(f.x - nx) < FISH_SIZE &&
              Math.abs(f.y - ny) < FISH_SIZE
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
          member.vx = leader.vx + (Math.random() - 0.5) * 0.5;
          member.vy = (Math.random() - 0.5) * 0.5;
          spawned.push(member);
          existingPositions.push(member);
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
      const factor = difficultyFactor();
      // FISH_SPAWN_INTERVAL_* are expressed in frames; convert to ms
      const min = (FISH_SPAWN_INTERVAL_MIN / FPS) * 1000;
      const max = (FISH_SPAWN_INTERVAL_MAX / FPS) * 1000;
      const delay = (min + Math.random() * (max - min)) * (1 / factor);

      fishSpawnTimeout.current = setTimeout(() => {
        if (state.current.phase !== "playing") return;
        const roll = Math.random();
        if (roll < 0.1) {
          spawnFish("brown", 1);
        } else if (roll < 0.15) {
          spawnFish("grey_long", 1);
        } else {
          const kind = basicKinds[Math.floor(Math.random() * basicKinds.length)];
          const count = Math.floor(Math.random() * 5) + 1;
          spawnFish(kind, count);
        }
        schedule();
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
