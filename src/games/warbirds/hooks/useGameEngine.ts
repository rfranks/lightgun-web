import {
  GRAVITY,
  MOUNTAIN_SCALE_MAX,
  MOUNTAIN_SCALE_MIN,
  WATER_MAX_SIZE,
  WATER_MIN_SIZE,
  WATER_SPAWN_PROB,
} from "@/constants/environment";
import {
  POWERUP_TYPES,
  NAPALM_EXPLODE_RADIUS,
  NAPALM_DROP_MIN,
  NAPALM_DROP_MAX,
  NAPALM_BURN_DURATION,
  SUPER_POWERUP_TYPES,
  ANTI_POWERUP_TYPES,
  DUCK_MAGNIFY_SCALE,
  DUCKSIGHT_MAGNIFY_SCALE,
  POWERUP_DURATION,
  MACHINE_GUN_BURST_COUNT,
  HOMING_MISSILE_SPAWN_RATE,
  HOMING_MISSILE_LIFETIME,
  ARTILLERY_RATE,
  ARTILLERY_SHELL_SPEED_MIN,
  ARTILLERY_SHELL_SPEED_MAX,
  ARTILLERY_SHELL_SIZE,
  NAPALM_SPAWN_INTERVAL,
  NAPALM_ALTITUDE_MIN,
  NAPALM_ALTITUDE_MAX,
  NAPALM_MISSILE_SIZE,
  NAPALM_MISSILE_SPEED,
  NAPALM_DROP_INTERVAL,
  NAPALM_BEGIN_EXPLODE_X,
  NAPALM_END_EXPLODE_X,
  CANNONBALL_SPEED,
  MACHINE_GUN_SHOT_INTERVAL,
  LASER_BEAM_BURST_COUNT,
  LASER_BEAM_SHOT_INTERVAL,
  LASER_BEAM_SPEED,
  SCRAMBLE_INTENSITY,
  SCORE_ARTILLERY_BONUS,
  NAPALM_FLAME_LENGTH,
  NAPALM_EXPLODE_NOT_DROP,
  NAPALM_TILE_SIZE,
  HOMING_MISSILE_SPEED,
  HOMING_MISSILE_SIZE,
  SCORE_HOMING_BONUS,
  SCORE_MACHINE_GUN_BONUS,
  SPRAY_DECREMENTS_AMMO,
  SPRAY_COUNT,
  SPRAY_SPREAD,
  SPRAY_INTERVAL,
} from "@/constants/powerups";
import { SCORE_DIGIT_WIDTH, SCORE_DIGIT_HEIGHT } from "@/constants/ui";
import {
  PLANE_WIDTH,
  PLANE_HEIGHT,
  AIRSHIP_BOB_FREQUENCY,
  AIRSHIP_BOB_AMPLITUDE,
  AIRSHIP_SIZE,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  AIRSHIP_SPAWN_PROB,
  AIRSHIP_COLORS,
  AIRSHIP_MIN_ALT,
  AIRSHIP_MAX_ALT,
  AIRSHIP_MIN_SPEED,
  AIRSHIP_MAX_SPEED,
} from "@/constants/vehicles";
import { useWindowSize } from "@/hooks/useWindowSize";
import { AudioMgr } from "@/types/audio";
import { Puff } from "@/types/effects";
import { PowerupType, AntiPowerupType, Duck } from "@/types/objects";
import { AssetMgr } from "@/types/ui";
import { Enemy } from "@/types/vehicles";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  MAX_AMMO,
  DEFAULT_CURSOR,
  FLAP_STRENGTH,
  PLANE_OFFSET_X,
  ENABLE_AUTO_FLAP,
  CLICK_RADIUS_MULTIPLIER,
  SCORE_FLAP,
  SCORE_DUCK,
  SCORE_RELOAD,
  MEDAL_SIZE,
  MEDAL_SCORE,
  SCORE_HIT,
  ENEMY_MEDAL_SPAWN_PROB,
  POWERUP_DEBUG,
  SMOKE_TRAIL_COUNT,
  MIN_STREAK,
  TEST_SLOW_FALL,
  ENEMY_FLAP_BASE,
  ENEMY_FLAP_RANDOM,
  ENEMY_CAN_FLAP,
  ENEMY_GLIDE_PROB,
  SKY_COLOR,
  ENEMY_FLAP_INTERVAL,
  ENEMY_LOOP_PROB,
  ENEMY_LOOP_DURATION,
  ENEMY_LOOP_RADIUS,
  ENEMY_STEP_PROB,
  ENEMY_MAX_STEP,
  ENEMY_STEP_DURATION,
  AUTO_FLAP_PROB,
  DEBUG_PLAYER_CRASH,
  INITIAL_ENEMY_DENSITY,
  ENEMY_DENSITY_STEP,
  SHOT_CURSOR,
} from "../constants";
import { GameState } from "../types";
import { initState } from "../utils";
import { useGameAssets } from "./useGameAssets";
import { useGameAudio } from "./useGameAudio";
import { Cloud, Mountain, Tree, Water } from "@/types/environment";
import {
  drawRandomCloud,
  drawRandomMountainRange,
  drawRandomTree,
  drawRandomWater,
} from "@/utils/environment";

export function useGameEngine() {
  // splash countdown 3→2→1
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimeoutsRef = useRef<number[]>([]);

  // ─── REFS & STATE ─────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<"title" | "ready" | "go" | "playing">(
    "title"
  );

  const audioMgr: AudioMgr = useGameAudio();
  const { play, pause } = audioMgr;

  const assetMgr: AssetMgr = useGameAssets();
  const { getImg } = assetMgr;

  // ─── WINDOW RESIZE ────────────────────────────────────────────────────────
  const dims = useWindowSize();

  const state = useRef<GameState>(initState(dims, assetMgr, audioMgr));

  const loopStartedRef = useRef(false);

  const [ui, setUI] = useState({
    score: 0,
    medalCount: 0,
    duckCount: 0,
    enemyCount: 0,
    ammo: MAX_AMMO,
    crashed: false,
    frameCount: 0,
    activePowerups: Object.fromEntries(
      POWERUP_TYPES.map((type) => [type, { expires: 0 }])
    ) as Record<PowerupType, { expires: number }>,
    cursor: DEFAULT_CURSOR,
  });

  // --- Helper Functions ---

  // ─── GAME STATE HELPERS ──────────────────────────────────────────────
  const syncUIFromState = useCallback(() => {
    const cur = state.current;
    // Only update if something changed
    if (
      ui.score !== cur.score ||
      ui.medalCount !== cur.medalCount ||
      ui.duckCount !== cur.duckCount ||
      ui.enemyCount !== cur.enemyCount ||
      ui.ammo !== cur.ammo ||
      ui.crashed !== cur.crashed ||
      ui.frameCount !== cur.frameCount ||
      JSON.stringify(ui.activePowerups) !==
        JSON.stringify(cur.activePowerups) ||
      ui.cursor !== cur.cursor
    ) {
      setUI({
        score: cur.score,
        medalCount: cur.medalCount,
        duckCount: cur.duckCount,
        enemyCount: cur.enemyCount,
        ammo: cur.ammo,
        crashed: cur.crashed,
        activePowerups: Object.fromEntries(
          Object.entries(cur.activePowerups).map(([type, powerup]) => [
            type as PowerupType,
            { expires: powerup.expires },
          ])
        ) as Record<PowerupType, { expires: number }>,
        frameCount: cur.frameCount,
        cursor: cur.cursor,
      });
    }
  }, [ui, setUI, state]);

  const changeScore = useCallback(
    (delta: number) => {
      const doubleScore =
        state.current.isActive("coin2x", state.current.frameCount) && delta > 0;
      const final = doubleScore ? delta * 2 : delta;

      state.current.score += final;
    },
    [state]
  );

  // ─── RESET STATE ─────────────────────────────────────────────────────────
  const resetState = useCallback(() => {
    state.current = {
      ...initState(dims, assetMgr, audioMgr),
      groundIndex: Math.floor(
        Math.random() * (getImg("groundImgs") as HTMLImageElement[]).length
      ),
    };
  }, [dims, assetMgr, audioMgr, getImg]);

  // ─── TEXT HELPER ───────────────────────────────────────────────────────
  const makeText = useCallback(
    (
      text: string,
      scale: number,
      fixed: boolean,
      fade: boolean,
      x?: number,
      y?: number,
      maxAge?: number
    ) => {
      // measure total width, accounting for spaces
      let totalWidth = 0;
      // give spaces a width roughly matching a digit
      const spaceGap = SCORE_DIGIT_WIDTH * 1.5 * scale;
      Array.from(text).forEach((ch) => {
        if (ch === " ") {
          totalWidth += spaceGap;
        } else {
          // use letterImgs, numberImgs, or digitImgs based on character type
          const letterImgs = getImg("letterImgs") as Record<
            string,
            HTMLImageElement
          >;
          const numberImgs = getImg("numberImgs") as Record<
            string,
            HTMLImageElement
          >;
          const digitImgs = getImg("digitImgs") as Record<
            string,
            HTMLImageElement
          >;
          const img =
            letterImgs[ch.toUpperCase()] || numberImgs[ch] || digitImgs[ch];
          if (img) {
            totalWidth += img.width * scale + 2;
          }
        }
      });
      const posX = x ?? (dims.width - totalWidth) / 2;
      const posY = y ?? dims.height * 0.2;

      state.current.textLabels.push({
        text,
        scale,
        fixed,
        fade,
        x: posX,
        y: posY,
        age: 0,
        maxAge: maxAge ? maxAge : fade ? 60 : Infinity,
      });
    },
    [dims.width, dims.height, getImg]
  );

  const spawnNapalmEllipse = useCallback(
    (cx: number, cy: number, killsPlayer: boolean) => {
      const rx = NAPALM_EXPLODE_RADIUS;
      const ry = NAPALM_EXPLODE_RADIUS * 0.5; // vertical radius is half the horizontal

      const count =
        NAPALM_DROP_MIN +
        Math.floor(Math.random() * (NAPALM_DROP_MAX - NAPALM_DROP_MIN + 1));

      for (let i = 0; i < count; i++) {
        const θ = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()); // uniform in disk
        const dx = Math.cos(θ) * r * rx;
        const dy = Math.sin(θ) * r * ry;

        state.current.napalmTiles.push({
          x: cx + dx,
          y: cy + dy,
          vy: 0,
          life: NAPALM_BURN_DURATION,
          maxLife: NAPALM_BURN_DURATION,
          killsPlayer,
        });
      }

      play("napalmExplodeSfx");
    },
    [play]
  );

  // ─── SPAWN ONE SMOKE PUFF ─────────────────────────────────────────────────
  // Spawn a single smoke puff at (x,y)
  const spawnCrashSmokeOne = useCallback(
    (x: number, y: number) => {
      const blackSmokeImgs = getImg("blackSmokeImgs") as HTMLImageElement[];
      const img =
        blackSmokeImgs[Math.floor(Math.random() * blackSmokeImgs.length)];
      state.current.puffs.push({
        x: x - 16,
        y: y - 16,
        vy: -(Math.random() * 1 + 0.5),
        img,
        age: 0,
        maxAge: 60,
      });
    },
    [getImg]
  );

  // spawn a new, randomly-shaped cloud
  const makeRandomCloud = useCallback(
    (canvasWidth: number, canvasHeight: number): Cloud => {
      return drawRandomCloud(
        canvasWidth,
        canvasHeight,
        getImg("whitePuffImgs") as HTMLImageElement[],
        () => state.current.groundSpeed(state.current.frameCount)
      );
    },
    [getImg, state]
  );

  const makeRandomMountainRange = useCallback(
    (canvasWidth: number, canvasHeight: number): Mountain[] => {
      return drawRandomMountainRange(
        canvasWidth,
        canvasHeight,
        getImg("rockImgs") as HTMLImageElement[],
        () => state.current.groundSpeed(state.current.frameCount),
        MOUNTAIN_SCALE_MIN,
        MOUNTAIN_SCALE_MAX
      );
    },
    [getImg, state]
  );

  const makeRandomTree = useCallback(
    (canvasWidth: number, canvasHeight: number, forcedScale?: number): Tree => {
      return drawRandomTree(
        canvasWidth,
        canvasHeight,
        getImg("treeImgs") as HTMLImageElement[],
        () => state.current.groundSpeed(state.current.frameCount),
        forcedScale
      );
    },
    [getImg, state]
  );

  function makeRandomWater(
    canvasWidth: number,
    groundY: number,
    size?: number
  ): Water {
    return drawRandomWater(
      canvasWidth,
      groundY,
      WATER_MIN_SIZE,
      WATER_MAX_SIZE,
      size
    );
  }
  const doSingleShot = useCallback(
    (sx: number, sy: number) => {
      play("shotSfx");

      const powerupImgs = getImg("powerupImgs") as Record<
        string,
        HTMLImageElement
      >;
      // flap on plane if clicked there
      let didFlap = false;

      let flapStrength = FLAP_STRENGTH;

      // first, your new anti‐powerups
      if (state.current.isActive("heavy", state.current.frameCount))
        flapStrength *= 0.5; // half as strong
      if (state.current.isActive("sticky", state.current.frameCount))
        flapStrength = 0; // no lift at all

      // then, wings still double whatever you have left
      if (state.current.isActive("wings", state.current.frameCount))
        flapStrength *= 2;

      const cx = PLANE_OFFSET_X + PLANE_WIDTH / 2;
      const cy = state.current.y + PLANE_HEIGHT / 2;
      if (
        !ENABLE_AUTO_FLAP &&
        Math.abs(sx - cx) <= PLANE_WIDTH * CLICK_RADIUS_MULTIPLIER &&
        Math.abs(sy - cy) <= PLANE_HEIGHT * CLICK_RADIUS_MULTIPLIER
      ) {
        didFlap = true;
        state.current.vy = flapStrength;
        state.current.planeAngle = -0.5;
        state.current.puffs.push({
          x: cx - 16,
          y: cy - 16,
          img: getImg("puffLargeImg") as HTMLImageElement,
          vy: 0,
          age: 0,
          maxAge: 20,
        });
        setTimeout(() => {
          state.current.puffs.push({
            x: cx - 16,
            y: cy - 16,
            img: getImg("puffSmallImg") as HTMLImageElement,
            vy: 0,
            age: 0,
            maxAge: 15,
          });
        }, 100);
        changeScore(SCORE_FLAP);
        state.current.floatingScores.push({
          x: cx,
          y: cy,
          vy: -1,
          amount: SCORE_FLAP,
          age: 0,
          maxAge: 60,
        });
        play("flapSfx");
      }

      let hit = false;

      // ─── AIRSHIP SHOOTING ─────────────────────────────────────────────────────
      for (let i = 0; i < state.current.airships.length; i++) {
        const a = state.current.airships[i];
        const bob =
          Math.sin(
            state.current.frameCount * AIRSHIP_BOB_FREQUENCY + a.bobOffset
          ) * AIRSHIP_BOB_AMPLITUDE;
        const ay = a.baseY + bob;

        if (
          sx >= a.x &&
          sx <= a.x + AIRSHIP_SIZE &&
          sy >= ay &&
          sy <= ay + AIRSHIP_SIZE
        ) {
          hit = true;

          state.current.airships.splice(i, 1);

          if (a.color === "green") {
            // drop a super powerup
            const t =
              SUPER_POWERUP_TYPES[
                Math.floor(Math.random() * SUPER_POWERUP_TYPES.length)
              ];
            state.current.powerups.push({
              x: a.x,
              y: ay,
              img: powerupImgs[t],
              type: t,
            });
          } else {
            // red airship: spawn a napalm explosion
            spawnNapalmEllipse(
              a.x + AIRSHIP_SIZE / 2,
              ay + AIRSHIP_SIZE / 2,
              true
            );

            // and drop a negative powerup
            const bad =
              ANTI_POWERUP_TYPES[
                Math.floor(Math.random() * ANTI_POWERUP_TYPES.length)
              ];
            state.current.powerups.push({
              x: a.x,
              y: ay,
              img: powerupImgs[bad],
              type: bad,
            });
          }

          break;
        }
      }

      // DUCK SHOOTING
      for (let i = 0; i < state.current.ducks.length; i++) {
        const d = state.current.ducks[i];
        const scale = state.current.isActive(
          "megaducks",
          state.current.frameCount
        )
          ? DUCK_MAGNIFY_SCALE
          : state.current.isActive("ducksight", state.current.frameCount)
          ? DUCKSIGHT_MAGNIFY_SCALE
          : 1;
        // compute the scaled size
        const w = d.width * scale;
        const h = d.height * scale;
        // offset the box so it's still centered on the duck’s original center
        const offsetX = (w - d.width) / 2;
        const offsetY = (h - d.height) / 2;
        const bx = d.x - offsetX;
        const by = d.y - offsetY;

        if (!d.hit && sx >= bx && sx <= bx + w && sy >= by && sy <= by + h) {
          play("duckSfx");

          changeScore(SCORE_DUCK);

          // update the duck state
          d.hit = true;
          d.fadeAge = 0;
          d.fadeMax = 60;
          d.targetImg = (getImg("duckTargetImgs") as HTMLImageElement[])[
            d.srcIdx
          ];

          // update the next state
          state.current.floatingScores.push({
            x: d.x + d.width / 2,
            y: d.y + d.height / 2,
            vy: -1,
            amount: SCORE_DUCK,
            age: 0,
            maxAge: 60,
          });

          state.current.shotLakes.add(d.waterRef);

          state.current.duckCount += 1;

          // flag the hit
          hit = true;

          break;
        }
      }

      // POWERUP COLLECTION
      for (let i = 0; i < state.current.powerups.length; i++) {
        const p = state.current.powerups[i];
        if (
          !p.collected &&
          sx >= p.x &&
          sx <= p.x + 128 &&
          sy >= p.y &&
          sy <= p.y + 128
        ) {
          p.collected = true;
          if (["bomb"].includes(p.type)) {
            // bomb powerup is instant
            play("bombSfx");

            state.current.activePowerups.bomb.expires =
              state.current.frameCount + 1;
          } else if (ANTI_POWERUP_TYPES.includes(p.type as AntiPowerupType)) {
            if (["sticky", "heavy", "windy"].includes(p.type)) {
              // sticky and heavy powerups expire at POWERUP_DURATION
              state.current.activePowerups[p.type].expires = POWERUP_DURATION;
            } else {
              // other anti-powerups expire immediately
              state.current.activePowerups[p.type].expires =
                state.current.frameCount + 30;
            }
          } else if (p.type === "machineGuns") {
            state.current.activePowerups["machineGuns"].expires =
              state.current.frameCount + POWERUP_DURATION;
            // reset burst count and cooldown
            state.current.burstRemaining = MACHINE_GUN_BURST_COUNT;
            state.current.burstCooldown = 0;
          } else if (p.type === "shrink") {
            state.current.activePowerups.shrink.expires =
              state.current.frameCount + POWERUP_DURATION;
            play("shrinkSfx");
          } else if (p.type === "freeze") {
            state.current.activePowerups.freeze.expires =
              state.current.frameCount + POWERUP_DURATION;
            play("freezeSfx");
          } else {
            state.current.activePowerups[p.type].expires =
              state.current.frameCount + POWERUP_DURATION;
            play("powerupSfx");
          }

          // special sound for skulls
          if (p.type === "skull") {
            play("skullSfx");

            // expire all powerups
            Object.keys(state.current.activePowerups).forEach((key) => {
              if (key === "skull") return; // skip skull
              state.current.activePowerups[key as PowerupType].expires = 0;
            });

            changeScore(-500);

            makeText(
              "Skull! Lose 500",
              1,
              true,
              true,
              dims.width - 800,
              dims.height * 0.8,
              120
            );
          } else if (p.type === "gunjam") {
            state.current.activePowerups.gunjam.expires =
              state.current.frameCount + POWERUP_DURATION;

            changeScore(-SCORE_RELOAD);

            play("reloadSfx");

            makeText(
              "Gunjam Lose 25",
              1,
              true,
              true,
              dims.width - 800,
              dims.height * 0.8,
              120
            );
            state.current.ammo = 0;
          }

          hit = true;
          state.current.powerups.splice(i, 1);
          break;
        }
      }

      // MEDAL PICKING
      for (let i = 0; i < state.current.medals.length; i++) {
        const m = state.current.medals[i];
        if (
          sx >= m.x &&
          sx <= m.x + MEDAL_SIZE &&
          sy >= m.y &&
          sy <= m.y + MEDAL_SIZE
        ) {
          play("medalSfx");

          changeScore(MEDAL_SCORE);

          state.current.floatingScores.push({
            x: m.x + MEDAL_SIZE / 2,
            y: m.y + MEDAL_SIZE / 2,
            vy: -1,
            amount: MEDAL_SCORE,
            age: 0,
            maxAge: 60,
          });
          state.current.medals.splice(i, 1);
          state.current.medalCount += 1;

          hit = true;

          break;
        }
      }

      const targetImg = (getImg("targetImgs") as HTMLImageElement[])[0];
      const targetWidth = targetImg.width;
      const targetHeight = targetImg.height;

      // ENEMY SHOOTING
      for (const e of state.current.enemies) {
        const targetYOffset = e.hasStick ? 0 : ENEMY_HEIGHT - targetHeight;

        if (
          e.alive &&
          e.hasStick &&
          !e.stickBroken &&
          sx >= e.x + ENEMY_WIDTH / 2 - targetWidth / 2 &&
          sx <= e.x + ENEMY_WIDTH / 2 + targetWidth / 2 &&
          sy >= e.y + targetYOffset &&
          sy <= e.y + targetYOffset + targetHeight
        ) {
          hit = true;
          e.stickBroken = true;
          e.targetHit = true;
          play("enemyHitSfx");
          changeScore(e.targetScore);

          // add a floating score
          state.current.floatingScores.push({
            x: e.x + ENEMY_WIDTH / 2,
            y: e.y + targetYOffset + targetHeight / 2,
            vy: -1,
            amount: e.targetScore,
            age: 0,
            maxAge: 60,
          });
        }

        if (
          !hit &&
          e.alive &&
          sx >= e.x &&
          sx <= e.x + ENEMY_WIDTH &&
          sy >= e.y &&
          sy <= e.y + ENEMY_HEIGHT
        ) {
          hit = true;
          e.alive = false;

          play("enemyHitSfx");

          changeScore(SCORE_HIT);

          const cxE = e.x + ENEMY_WIDTH / 2;
          const cyE = e.y + ENEMY_HEIGHT / 2;

          state.current.enemyCount += 1;

          // medal or powerup spawn
          if (Math.random() < ENEMY_MEDAL_SPAWN_PROB) {
            const medalId = Math.floor(Math.random() * 9);
            const medalFrames = getImg("medalFrames") as HTMLImageElement[][];
            const frames = medalFrames[medalId];
            state.current.medals.push({
              x: cxE - MEDAL_SIZE / 2,
              y: cyE - MEDAL_SIZE / 2,
              vx: -state.current.groundSpeed(state.current.frameCount),
              frames,
              frameIndex: 0,
              frameCounter: 0,
              frameRate: 8,
              id: medalId + 1,
            });
          } else if (Math.random() < 0.5) {
            const types: PowerupType[] = POWERUP_TYPES;
            let t =
              POWERUP_DEBUG.length > 0
                ? POWERUP_DEBUG[
                    Math.floor(Math.random() * POWERUP_DEBUG.length)
                  ]
                : types[Math.floor(Math.random() * types.length)];

            // increase the chance of an anti-powerup
            // if the type is not an anti-powerup, randomly change it to one
            // with a 50% chance
            // this is to encourage players to avoid anti-powerups
            if (
              POWERUP_DEBUG.length === 0 &&
              !ANTI_POWERUP_TYPES.includes(t as AntiPowerupType) &&
              Math.random() < 0.5
            ) {
              t =
                ANTI_POWERUP_TYPES[
                  Math.floor(Math.random() * ANTI_POWERUP_TYPES.length)
                ];
            }

            state.current.powerups.push({
              x: cxE - 16,
              y: cyE - 16,
              img: powerupImgs[t],
              type: t,
            });
          }

          state.current.floatingScores.push({
            x: cxE,
            y: cyE,
            vy: -1,
            amount: SCORE_HIT,
            age: 0,
            maxAge: 60,
          });

          const explosionImgs = getImg("explosionImgs") as HTMLImageElement[];

          // crash effect
          const effect = Math.floor(Math.random() * 3);
          if (effect === 0) {
            for (let i = 0; i < SMOKE_TRAIL_COUNT; i++)
              setTimeout(() => spawnCrashSmokeOne(cxE, cyE), i * 100);
          } else if (effect === 1) {
            const size = 32 * 3;
            explosionImgs.forEach((img, idx) =>
              setTimeout(
                () =>
                  state.current.puffs.push({
                    x: cxE - 16,
                    y: cyE - 16,
                    img,
                    vy: 0,
                    age: 0,
                    maxAge: 10,
                    size,
                  }),
                idx * 50
              )
            );
          } else {
            state.current.puffs.push({
              x: cxE - 48,
              y: cyE - 48,
              img: explosionImgs[0],
              vy: 0,
              age: 0,
              maxAge: 10,
              size: 32 * 3,
            });
            state.current.falling.push({
              x: e.x,
              y: e.y,
              vy: 0,
              img: e.frames[0],
            });
          }
          break;
        }
      }

      // MISS → bullet hole & penalty
      if (!hit && !didFlap) {
        changeScore(-25);
        state.current.streak = 0;
        state.current.bulletHoles.push({ x: sx, y: sy, age: 0, maxAge: 180 });
      }

      // STREAK pop-up
      if (hit || didFlap) {
        state.current.streak += 1;

        if (state.current.streak >= MIN_STREAK) {
          makeText(
            `Streak: ${state.current.streak}`,
            1,
            true,
            true,
            dims.width - 800,
            16 + 2 * SCORE_DIGIT_HEIGHT + 8,
            120
          );
        }
      }
    },
    [
      play,
      getImg,
      state,
      changeScore,
      spawnNapalmEllipse,
      makeText,
      dims.width,
      dims.height,
      spawnCrashSmokeOne,
    ]
  );

  const isActive = useCallback(
    (powerup: PowerupType) => {
      if (!ui.activePowerups[powerup]) return false;
      return ui.activePowerups[powerup].expires > ui.frameCount;
    },
    [ui.activePowerups, ui.frameCount]
  );

  // ─── GAME INIT + SPLASH ──────────────────────────────────────────────
  // ─── SPLASH + PRELOAD ─────────────────────────────────────────────────────
  const startSplash = useCallback(() => {
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);

    countdownTimeoutsRef.current.forEach(clearTimeout);
    countdownTimeoutsRef.current = [];

    setPhase("ready");
    setCountdown(3);

    countdownTimeoutsRef.current.push(
      window.setTimeout(() => setCountdown(2), 1000),
      window.setTimeout(() => setCountdown(1), 2000),
      window.setTimeout(() => setCountdown(null), 3000),
      window.setTimeout(() => setPhase("go"), 3000),
      window.setTimeout(() => {
        setPhase("playing");
        // Do your full game state reset **here**
        state.current = {
          ...initState(dims, assetMgr, audioMgr),
          groundIndex: Math.floor(
            Math.random() * (getImg("groundImgs") as HTMLImageElement[]).length
          ),
        };
      }, 3500)
    );
    play("flightSfx");
  }, [dims, assetMgr, audioMgr, getImg, play]);

  // ─── INIT & RENDER LOOP ───────────────────────────────────────────────────
  const initLoop = useCallback(() => {
    console.log("Game initLoop");
    if (loopStartedRef.current) {
      console.log("initLoop called, but loop already running—skipping.");
      return;
    }
    loopStartedRef.current = true;

    const waterImgs = getImg("waterImgs") as HTMLImageElement[];

    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dims;
    canvas.width = width;
    canvas.height = height;

    resetState();

    // flight hum
    play("flightSfx");

    const groundY = height - 50;
    const groundImgs = getImg("groundImgs") as HTMLImageElement[];
    const tileW = groundImgs[0].width;

    const render = () => {
      // if shrink is active, scale enemies to 40%
      const enemyScale = state.current.isActive(
        "shrink",
        state.current.frameCount
      )
        ? 0.4
        : 1;
      const gravityBase = TEST_SLOW_FALL ? 0.5 * GRAVITY : GRAVITY;
      const gravity = state.current.isActive("freeze", state.current.frameCount)
        ? 0
        : state.current.isActive("hourglass", state.current.frameCount)
        ? gravityBase * 0.5
        : gravityBase;
      const flapStrength = state.current.isActive(
        "wings",
        state.current.frameCount
      )
        ? FLAP_STRENGTH * 2
        : FLAP_STRENGTH;

      if (state.current.isActive("thunderstrike", state.current.frameCount)) {
        state.current.thunderCooldown -= 1;
        if (state.current.thunderCooldown <= 0) {
          state.current.thunderCooldown = 180; // 3 seconds @60fps

          const targets = [
            ...state.current.enemies.filter((e) => e.alive),
            // ...ducks.filter((d) => !d.hit),
          ];

          if (targets.length > 0) {
            const tx = PLANE_OFFSET_X + PLANE_WIDTH;
            const ty = state.current.y + PLANE_HEIGHT / 2;
            targets.sort((a, b) => {
              const da = Math.hypot(tx - a.x, ty - a.y);
              const db = Math.hypot(tx - b.x, ty - b.y);
              return da - db;
            });

            const struck: (Duck | Enemy)[] = [];
            const first = targets[0];
            struck.push(first);
            const cx = first.x;
            const cy = first.y;

            // Chain up to 2 more targets within 300px
            for (let i = 1; i < targets.length && struck.length < 3; i++) {
              const d = Math.hypot(cx - targets[i].x, cy - targets[i].y);
              if (d < 300) struck.push(targets[i]);
            }

            struck.forEach((t, idx) => {
              if ("alive" in t) t.alive = false;
              if ("hit" in t) t.hit = true;

              state.current.floatingScores.push({
                x: t.x,
                y: t.y,
                vy: -1,
                amount: 200,
                age: 0,
                maxAge: 60,
              });
              changeScore(200);
              state.current.enemyCount += 1;

              // Spawn spark effect
              state.current.sparkEffects.push({
                x: t.x,
                y: t.y - 50,
                age: 0,
                maxAge: 60,
                frameIndex: 0,
              });

              // Optional chained line visual:
              if (idx > 0) {
                const prev = struck[0];
                state.current.sparkEffects.push({
                  x: (prev.x + t.x) / 2,
                  y: (prev.y + t.y) / 2 - 30,
                  age: 0,
                  maxAge: 20,
                  frameIndex: 0,
                });
              }
            });

            play("thunderSfx");
          }
        }
      }

      // ─── HOMING MISSILE SPAWN ─────────────────────────────────────────
      if (
        state.current.isActive("homing", state.current.frameCount) &&
        Math.random() < HOMING_MISSILE_SPAWN_RATE
      ) {
        // pick nearest live duck, else first enemy
        const target: Duck | Enemy | undefined = state.current.enemies[0];

        state.current.homingMissiles.push({
          x: PLANE_OFFSET_X + PLANE_WIDTH,
          y: state.current.y + PLANE_HEIGHT / 2,
          vx: 0,
          vy: 0,
          img: getImg("homingImg") as HTMLImageElement,
          tailFrame: 0,
          tailCounter: 0,
          life: HOMING_MISSILE_LIFETIME,
          target,
        });
      }

      // ─── ARTILLERY SPAWN ───────────────────────────────────────────────
      if (
        state.current.isActive("artillery", state.current.frameCount) &&
        Math.random() < ARTILLERY_RATE
      ) {
        const startX = Math.random() * (width - 200) + 200;
        // steeper shots: base = straight down (π/2), ±30°
        const θ = Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3); // 60° → 120°
        const speed =
          ARTILLERY_SHELL_SPEED_MIN +
          Math.random() *
            (ARTILLERY_SHELL_SPEED_MAX - ARTILLERY_SHELL_SPEED_MIN);
        state.current.artilleryShells.push({
          x: startX,
          y: -ARTILLERY_SHELL_SIZE,
          vx: Math.cos(θ) * speed,
          vy: Math.sin(θ) * speed,
          img: getImg("artilleryImg") as HTMLImageElement,
        });
      }

      // ─── NAPALM MISSILE SPAWN ─────────────────────────────────────────
      if (
        state.current.isActive("napalm", state.current.frameCount) &&
        Math.random() < NAPALM_SPAWN_INTERVAL
      ) {
        // pick a random altitude band (10–30% down from top)
        const altPct =
          NAPALM_ALTITUDE_MIN +
          Math.random() * (NAPALM_ALTITUDE_MAX - NAPALM_ALTITUDE_MIN);
        state.current.napalmMissiles.push({
          x: -NAPALM_MISSILE_SIZE / 2,
          y: height * altPct,
          vx: NAPALM_MISSILE_SPEED,
          life: Math.ceil((width + NAPALM_MISSILE_SIZE) / NAPALM_MISSILE_SPEED),
          dropsRemaining:
            NAPALM_DROP_MIN +
            Math.floor(Math.random() * (NAPALM_DROP_MAX - NAPALM_DROP_MIN + 1)),
          dropTimer: NAPALM_DROP_INTERVAL,
          img: getImg("napalmImg") as HTMLImageElement,
          tailFrame: 0,
          tailCounter: 0,
          explodeX:
            NAPALM_BEGIN_EXPLODE_X +
            Math.random() * (NAPALM_END_EXPLODE_X - NAPALM_BEGIN_EXPLODE_X),
        });
      }

      // ─── LASERBEAM AUTO-FIRE ──────────────────────────────────────────
      if (state.current.isActive("laserbeam", state.current.frameCount)) {
        if (state.current.laserBurstRemaining === 0 && Math.random() < 0.01) {
          state.current.laserBurstRemaining = LASER_BEAM_BURST_COUNT;
          state.current.laserBurstCooldown = 0;
        }
        if (state.current.laserBurstRemaining > 0) {
          if (state.current.laserBurstCooldown === 0) {
            state.current.laserBeams.push({
              x: PLANE_OFFSET_X + PLANE_WIDTH,
              y: state.current.y + PLANE_HEIGHT / 2,
              frame: 0,
              frameCounter: 0,
            });
            state.current.laserBurstRemaining--;
            state.current.laserBurstCooldown = LASER_BEAM_SHOT_INTERVAL;
          } else {
            state.current.laserBurstCooldown--;
          }
        }
      }

      // ─── MACHINE-GUN AUTO-FIRE ────────────────────────────────────────
      if (state.current.isActive("machineGuns", state.current.frameCount)) {
        // start a new burst occasionally
        if (state.current.burstRemaining === 0 && Math.random() < 0.01) {
          state.current.burstRemaining = MACHINE_GUN_BURST_COUNT;
          state.current.burstCooldown = 0;
        }
        // fire one shot every MACHINE_GUN_SHOT_INTERVAL frames
        if (state.current.burstRemaining > 0) {
          if (state.current.burstCooldown === 0) {
            // spawn a cannonball
            const yCenter = state.current.y + PLANE_HEIGHT / 2;
            state.current.cannonballs.push({
              x: PLANE_OFFSET_X + PLANE_WIDTH,
              y: yCenter,
              vx: CANNONBALL_SPEED,
              img: getImg("cannonballImg") as HTMLImageElement,
            });
            play("cannonballSfx");
            state.current.burstRemaining--;
            state.current.burstCooldown = MACHINE_GUN_SHOT_INTERVAL;
          } else {
            state.current.burstCooldown--;
          }
        }
      }

      // advance player prop
      const planeFrames = getImg("planeFrames") as HTMLImageElement[];
      state.current.planeFrameCounter++;
      if (state.current.planeFrameCounter >= 6) {
        state.current.planeFrameCounter = 0;
        state.current.planeFrame =
          (state.current.planeFrame + 1) % planeFrames.length;
      }

      state.current.frameCount++;

      // spawn enemy with dynamic rate
      const enemyFrames = getImg("enemyFrames") as HTMLImageElement[][];
      if (Math.random() < state.current.dynamicDensity) {
        const colorIdx = Math.floor(Math.random() * enemyFrames.length);

        const hasStick = Math.random() < 0.25;
        let targetIdx: number = -1,
          targetScore: number = -1;
        if (hasStick) {
          targetIdx = Math.floor(Math.random() * 3);
          targetScore = [500, 250, 100][targetIdx];
        }

        state.current.enemies.push({
          x: width + ENEMY_WIDTH,
          y: 50 + Math.random() * (height - 200),
          vy: 0,
          flapStrength: -(ENEMY_FLAP_BASE + Math.random() * ENEMY_FLAP_RANDOM),
          // point to the chosen frame set
          frames: enemyFrames[colorIdx],
          propFrame: Math.floor(Math.random() * 3),
          frameRate: 6, // advance propeller every 6 game frames
          frameCounter: 0,
          alive: true,
          glide: ENEMY_CAN_FLAP ? Math.random() < ENEMY_GLIDE_PROB : true,
          loopProgress: -1,
          baseY: 50 + Math.random() * (height - 200),
          rotation: 0,
          // initialize our “step” state
          stepProgress: -1,
          stepDelta: 0,
          hasStick,
          stickBroken: false,
          stickImg: getImg("stickImg") as HTMLImageElement,
          brokenStickImg: getImg("brokenStickImg") as HTMLImageElement,
          targetImg: hasStick
            ? (getImg("targetImgs") as HTMLImageElement[])[targetIdx]
            : undefined!,
          targetType: hasStick
            ? (`red${targetIdx + 1}` as "red1" | "red2" | "red3")
            : undefined!,
          targetScore: hasStick ? targetScore : 0,
          targetFadeAge: 0,
          targetFadeMax: hasStick ? 60 : 0,
          targetHit: false,
          targetVy: 0,
        });
      }

      // clear sky
      ctx.fillStyle = SKY_COLOR;
      ctx.fillRect(0, 0, width, height);

      // maybe spawn a new distant mountain
      if (Math.random() < 0.001) {
        const newRange = makeRandomMountainRange(width, height);
        // compute the horizontal span of the new range
        const startX = Math.min(...newRange.map((m) => m.x));
        const endX = Math.max(...newRange.map((m) => m.x + m.width));
        // check overlap against any existing mountain
        const overlap = state.current.mountains.some((m) => {
          const mStart = m.x;
          const mEnd = m.x + m.width;
          return startX < mEnd && mStart < endX;
        });
        if (!overlap) {
          state.current.mountains.push(...newRange);
        }
      }

      // draw + move all mountains (behind clouds & everything)
      state.current.mountains.forEach((m, i) => {
        m.x += m.vx;
        ctx.globalAlpha = 0.8;
        ctx.drawImage(m.img, m.x, m.y + 40, m.width, m.height);
        ctx.globalAlpha = 1;
        // remove once it drifts fully off left edge
        if (m.x + canvas.width < 0) {
          state.current.mountains.splice(i, 1);
        }
      });

      // maybe spawn a new tree
      if (Math.random() < 0.005) {
        state.current.trees.push(makeRandomTree(width, height));
      }

      // draw + move all trees (in front of mountains but behind clouds)
      state.current.trees.forEach((t, i) => {
        t.x += t.vx;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(t.img, t.x, t.y, t.width, t.height);
        ctx.globalAlpha = 1;
        // remove once it drifts off left
        if (t.x + t.width + canvas.width < 0) state.current.trees.splice(i, 1);
      });

      // maybe spawn a new drifting cloud, but only if none are still off-screen to the right
      if (Math.random() < 0.0015) {
        const isCloudEntering = state.current.clouds.some((c) => c.x > width);
        if (!isCloudEntering) {
          state.current.clouds.push(makeRandomCloud(width, height));
        }
      }

      // draw + move all clouds (behind everything)
      state.current.clouds.forEach((c, i) => {
        c.x += c.vx;
        c.puffs.forEach(({ img, dx, dy, scale }) => {
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.globalAlpha = 0.8;
          ctx.drawImage(img, c.x + dx, c.y + dy, w, h);
        });
        ctx.globalAlpha = 1;
        if (c.x + canvas.width * 1.5 < 0) state.current.clouds.splice(i, 1);
      });

      // maybe spawn an airship
      if (Math.random() < AIRSHIP_SPAWN_PROB) {
        const color =
          AIRSHIP_COLORS[Math.floor(Math.random() * AIRSHIP_COLORS.length)];
        const altPct =
          AIRSHIP_MIN_ALT + Math.random() * (AIRSHIP_MAX_ALT - AIRSHIP_MIN_ALT);
        const baseY = height * altPct;
        const speed =
          AIRSHIP_MIN_SPEED +
          Math.random() * (AIRSHIP_MAX_SPEED - AIRSHIP_MIN_SPEED);

        const startX = -AIRSHIP_SIZE * 3; // * 3 gives them a head start
        state.current.airships.push({
          x: startX,
          baseY,
          frames: (
            getImg("airshipFrames") as Record<string, HTMLImageElement[]>
          )[color],
          frameIndex: Math.floor(Math.random() * 3),
          frameCounter: 0,
          frameRate: 10,
          speed,
          color,
          bobOffset: Math.random() * Math.PI * 2,
        });
      }

      // update & draw all airships
      state.current.airships = state.current.airships.filter((a) => {
        a.x += a.speed;
        const bob =
          Math.sin(
            state.current.frameCount * AIRSHIP_BOB_FREQUENCY + a.bobOffset
          ) * AIRSHIP_BOB_AMPLITUDE;
        const drawY = a.baseY + bob;

        // advance propeller frame
        a.frameCounter++;
        if (a.frameCounter >= a.frameRate) {
          a.frameCounter = 0;
          a.frameIndex = (a.frameIndex + 1) % a.frames.length;
        }

        const img = a.frames[a.frameIndex];
        ctx.drawImage(img, a.x, drawY, AIRSHIP_SIZE, AIRSHIP_SIZE);

        return a.x <= width + img.width;
      });

      // whoosh SFX control
      if (
        state.current.airships.length > 0 &&
        !state.current.whooshPlaying &&
        !state.current.crashed
      ) {
        play("whooshSfx");
        state.current.whooshPlaying = true;
      } else if (
        state.current.airships.length === 0 &&
        state.current.whooshPlaying
      ) {
        pause("whooshSfx");
        state.current.whooshPlaying = false;
      }
      if (state.current.crashed && state.current.whooshPlaying) {
        pause("whooshSfx");
        state.current.whooshPlaying = false;
      }

      // draw text labels
      state.current.textLabels.forEach((lbl) => {
        const alpha = lbl.fade ? 1 - lbl.age / lbl.maxAge : 1;
        ctx.globalAlpha = alpha;

        const drawX = lbl.fixed ? lbl.x : lbl.x - state.current.groundOffset;
        let dx = drawX;
        // same spaceGap you used when measuring
        const spaceGap = SCORE_DIGIT_WIDTH * lbl.scale;
        for (const ch of lbl.text) {
          if (ch === " ") {
            dx += spaceGap;
          } else {
            const letterImgs = getImg("letterImgs") as Record<
              string,
              HTMLImageElement
            >;
            const numberImgs = getImg("numberImgs") as Record<
              string,
              HTMLImageElement
            >;
            const digitImgs = getImg("digitImgs") as Record<
              string,
              HTMLImageElement
            >;
            const img =
              letterImgs[ch.toUpperCase()] || numberImgs[ch] || digitImgs[ch];
            if (img) {
              const w = img.width * lbl.scale;
              ctx.drawImage(img, dx, lbl.y, w, img.height * lbl.scale);
              dx += w + 2;
            }
          }
        }
        ctx.globalAlpha = 1;
        lbl.age++;
      });
      // remove expired
      state.current.textLabels = state.current.textLabels.filter(
        (l) => l.age < l.maxAge
      );

      // draw bullet holes on background
      state.current.bulletHoles.forEach((h) => {
        ctx.globalAlpha = 1 - h.age / h.maxAge;
        ctx.drawImage(
          getImg("bulletHoleImg") as HTMLImageElement,
          h.x - 16,
          h.y - 16,
          32,
          32
        );
        h.age++;
      });
      state.current.bulletHoles = state.current.bulletHoles.filter(
        (h) => h.age < h.maxAge
      );
      ctx.globalAlpha = 1;

      // update + draw enemies
            const freezeActive = state.current.isActive(
        "freeze",
        state.current.frameCount
      );

      state.current.enemies.forEach((e) => {
        const cx = e.x + ENEMY_WIDTH / 2;
        const cy = e.y + ENEMY_HEIGHT / 2;

        // draw with shrink scale if needed
        const drawW = ENEMY_WIDTH * enemyScale;
        const drawH = ENEMY_HEIGHT * enemyScale;

        if (!e.alive) return;

        if (!freezeActive &&!e.glide) {
          // flappers obey gravity + flap
          if (state.current.frameCount % ENEMY_FLAP_INTERVAL === 0) {
            e.vy = e.flapStrength;
          }
          e.vy += gravity;
          e.y += e.vy;
          // keep above ground
          if (e.y + ENEMY_HEIGHT >= groundY) {
            e.y = groundY - ENEMY_HEIGHT;
            e.vy = e.flapStrength;
          }
        } else if (!freezeActive) {
          // glider: maybe start a backwards loop
          if (e.loopProgress < 0 && Math.random() < ENEMY_LOOP_PROB) {
            e.loopProgress = 0;
            e.baseY = e.y;
          }
          if (e.loopProgress >= 0) {
            // animate loop
            const t = e.loopProgress / ENEMY_LOOP_DURATION;
            const theta = t * Math.PI * 2;
            e.y = e.baseY + ENEMY_LOOP_RADIUS * Math.sin(theta);
            e.rotation = theta;
            e.loopProgress++;
            if (e.loopProgress > ENEMY_LOOP_DURATION) {
              // end loop
              e.loopProgress = -1;
              e.rotation = 0;
              e.y = e.baseY;
            }
          }

          // when not looping, occasionally do a small climb/dive stepwise
          if (e.loopProgress < 0) {
            // kick off a new random altitude step?
            if (e.stepProgress < 0 && Math.random() < ENEMY_STEP_PROB) {
              e.stepProgress = 0;
              // calculate safe vertical range
              const topLimit = 50;
              const bottomLimit = groundY - ENEMY_HEIGHT - 50;
              const minShift = topLimit - e.baseY;
              const maxShift = bottomLimit - e.baseY;
              e.stepDelta = Math.min(
                minShift + Math.random() * (maxShift - minShift),
                ENEMY_MAX_STEP
              );
            }

            // animate the step
            if (e.stepProgress >= 0) {
              const t2 = e.stepProgress / ENEMY_STEP_DURATION;
              e.y = e.baseY + e.stepDelta * t2;

              // pitch the plane to match climb/dive
              const dy = e.stepDelta / ENEMY_STEP_DURATION;
              // angle in radians: up → negative, down → positive
              e.rotation =
                -1 *
                Math.atan2(
                  dy,
                  state.current.enemySpeed(state.current.frameCount)
                );

              e.stepProgress++;
              if (e.stepProgress > ENEMY_STEP_DURATION) {
                // commit the step and level out
                e.baseY += e.stepDelta;
                e.y = e.baseY;
                e.stepProgress = -1;
                e.rotation = 0;
              }
            } else {
              // not stepping → keep level
              e.rotation = 0;
            }

            // animate the in-progress step
            if (e.stepProgress >= 0) {
              const t2 = e.stepProgress / ENEMY_STEP_DURATION;
              e.y = e.baseY + e.stepDelta * t2;
              e.stepProgress++;
              if (e.stepProgress > ENEMY_STEP_DURATION) {
                // commit the shift and reset
                e.baseY += e.stepDelta;
                e.y = e.baseY;
                e.stepProgress = -1;
              }
            }
          }
        }

        // if windy effect is active, add a little random jitter:
        if (!freezeActive && state.current.isActive("windy", state.current.frameCount)) {
          e.x += (Math.random() * 2 - 1) * SCRAMBLE_INTENSITY;
          e.y += (Math.random() * 2 - 1) * SCRAMBLE_INTENSITY;
          // optional: randomize their flapStrength too
          e.flapStrength = -(
            ENEMY_FLAP_BASE +
            Math.random() * ENEMY_FLAP_RANDOM
          );
        }

        // move forward in the direction we’re facing:
        // cos(rotation)=+1 when level right, –1 when upside-down (so we reverse)
        if (!freezeActive) {
          const facing = Math.cos(e.rotation || 0);
          e.x -= state.current.enemySpeed(state.current.frameCount) * facing;
        }
        
        // draw flipped horizontally *around its center*
        // advance propeller
        e.frameCounter++;
        if (e.frameCounter >= e.frameRate) {
          e.frameCounter = 0;
          e.propFrame = (e.propFrame + 1) % e.frames.length;
        }
        const imgToDraw = e.frames[e.propFrame];

        ctx.save();
        ctx.translate(cx, cy);
        // apply loop rotation if any
        if (e.rotation) {
          ctx.rotate(e.rotation);
        }
        ctx.scale(-1, 1);
        ctx.drawImage(imgToDraw, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // ─── DRAW STICK + TARGET ON TOP OF THE PLANE (always, even during loops)
        if (e.hasStick) {
          ctx.save();
          ctx.translate(cx, cy);
          if (e.rotation) ctx.rotate(e.rotation);
          ctx.scale(-1, 1);
          // draw stick (broken or intact)
          const sw = e.stickImg.width * 0.5;
          const sh = e.stickImg.height * 0.5;
          ctx.save();
          ctx.rotate(Math.PI);
          ctx.drawImage(
            e.stickBroken ? e.brokenStickImg : e.stickImg,
            -sw / 2,
            -sh,
            sw,
            sh
          );
          ctx.restore();
          // draw hanging target if not yet hit
          if (!e.targetHit) {
            const tw = e.targetImg!.width * 0.5;
            const th = e.targetImg!.height * 0.5;
            const yOffset = 120;
            ctx.drawImage(e.targetImg!, -tw / 2, -sh + yOffset, tw, th);
          }
          ctx.restore();
        }

        // random little puffs from a healthy enemy
        if (Math.random() < 0.02) {
          spawnCrashSmokeOne(cx, cy);
        }

        // kill once fully off left-side
        if (e.x + ENEMY_WIDTH < 0) e.alive = false;
      });
      state.current.enemies = state.current.enemies.filter((e) => e.alive);

      const autoFlap = () => {
        // trigger a flap just like user click
        state.current.vy = flapStrength;
        state.current.planeAngle = -0.5;
        const cx = PLANE_OFFSET_X + PLANE_WIDTH / 2;
        const cy = state.current.y + PLANE_HEIGHT / 2;
        // big + small puffs
        state.current.puffs.push({
          x: cx - 16,
          y: cy - 16,
          img: getImg("puffLargeImg") as HTMLImageElement,
          vy: 0,
          age: 0,
          maxAge: 20,
        });
        setTimeout(
          () =>
            state.current.puffs.push({
              x: cx - 16,
              y: cy - 16,
              img: getImg("puffSmallImg") as HTMLImageElement,
              vy: 0,
              age: 0,
              maxAge: 15,
            }),
          100
        );
      };

      // ─── AUTO‐FLAP (if enabled) ───────────────────────────────────────────
      if (
        ENABLE_AUTO_FLAP &&
        !state.current.crashed &&
        Math.random() < AUTO_FLAP_PROB &&
        state.current.y > 0
      ) {
        autoFlap();
      }

      // physics + collision
      if (!state.current.crashed) {
        state.current.vy += gravity;
        state.current.y += state.current.vy;

        // collision with ground
        if (state.current.y + PLANE_HEIGHT >= groundY) {
          if (ENABLE_AUTO_FLAP) {
            autoFlap(); // flap to avoid crash
          } else {
            // just sit on the ground (but never “die”)
            state.current.y = groundY - PLANE_HEIGHT;
            // you can still emit smoke once
            if (!state.current.crashHandled) {
              state.current.groundCrashPuffsLeft = SMOKE_TRAIL_COUNT;
              state.current.crashHandled = true;
            }
          }
        }

        // collision between player & any enemy ⇒ both go on fire & fall
        if (
          !state.current.isActive("ghost", state.current.frameCount) &&
          !state.current.crashed
        ) {
          state.current.enemies.forEach((e) => {
            const px = PLANE_OFFSET_X + PLANE_WIDTH / 2;
            const py = state.current.y + PLANE_HEIGHT / 2;

            if (
              e.x < px + PLANE_WIDTH / 2 &&
              e.x + ENEMY_WIDTH > px - PLANE_WIDTH / 2 &&
              e.y < py + PLANE_HEIGHT / 2 &&
              e.y + ENEMY_HEIGHT > py - PLANE_HEIGHT / 2
            ) {
              state.current.crashed = true;
              state.current.groundContactFrames = 0;

              e.alive = false;
              const explosionImgs = getImg(
                "explosionImgs"
              ) as HTMLImageElement[];

              // spawn enemy falling-on-fire
              const randExpE =
                explosionImgs[Math.floor(Math.random() * explosionImgs.length)];
              state.current.falling.push({
                x: e.x,
                y: e.y,
                vy: 0,
                img: randExpE,
              });
              // spawn player falling-on-fire
              const randExpP =
                explosionImgs[Math.floor(Math.random() * explosionImgs.length)];
              state.current.falling.push({
                x: PLANE_OFFSET_X,
                y: state.current.y,
                vy: 0,
                img: randExpP,
              });
            }
          });
        }

        if (
          state.current.crashed &&
          !DEBUG_PLAYER_CRASH &&
          !state.current.isActive("ghost", state.current.frameCount)
        ) {
          if (state.current.isActive("shield", state.current.frameCount)) {
            // block it once:
            // shield is one‐time use
            state.current.activePowerups.shield.expires = 0;
            // trigger shield flash
            state.current.shieldFlash = 10;
            // shielded so no crash
            state.current.crashed = false;
            // play shield sound
            play("shieldSfx");
          } else {
            state.current.crashed = true;

            Object.keys(state.current.activePowerups).forEach((key) => {
              state.current.activePowerups[key as PowerupType].expires = 0; // one‐time use
            });

            play("crashSfx");
            pause("flightSfx");
          }
        }
      }

      // ─── AUTO-COLLECT MEDALS ON PLANE COLLISION ───────────────────────────────
      const planeX = PLANE_OFFSET_X;
      const planeY = state.current.y;
      const planeW = PLANE_WIDTH;
      const planeH = PLANE_HEIGHT;

      const planeCenter = {
        x: PLANE_OFFSET_X + PLANE_WIDTH / 2,
        y: state.current.y + PLANE_HEIGHT / 2,
      };

      for (let i = state.current.medals.length - 1; i >= 0; i--) {
        const m = state.current.medals[i];
        // bounding‐box test
        if (
          m.x < planeX + planeW &&
          m.x + MEDAL_SIZE > planeX &&
          m.y < planeY + planeH &&
          m.y + MEDAL_SIZE > planeY
        ) {
          // collect it!
          play("medalSfx");

          changeScore(MEDAL_SCORE);
          state.current.floatingScores.push({
            x: m.x + MEDAL_SIZE / 2,
            y: m.y + MEDAL_SIZE / 2,
            vy: -1,
            amount: MEDAL_SCORE,
            age: 0,
            maxAge: 60,
          });

          state.current.medals.splice(i, 1);

          state.current.medalCount++;
        }
      }

      // ─── draw medals ─────────────────────────────────────────────────
      state.current.medals.forEach((m, idx) => {
        // advance spin
        m.frameCounter++;
        if (m.frameCounter >= m.frameRate) {
          m.frameCounter = 0;
          m.frameIndex = (m.frameIndex + 1) % m.frames.length;
        }
        // move
        m.x += m.vx;

        if (
          state.current.isActive("magnet", state.current.frameCount) ||
          state.current.isActive("supermag", state.current.frameCount)
        ) {
          // pull toward plane center
          const dx = planeCenter.x - (m.x + MEDAL_SIZE / 2);
          const dy = planeCenter.y - (m.y + MEDAL_SIZE / 2);
          const dist = Math.hypot(dx, dy);

          if (dist < 500) {
            // lerp medal.x/y toward plane center:
            m.x += (PLANE_OFFSET_X - m.x) * 0.05;
            m.y += (state.current.y - m.y) * 0.05;
          }
        }

        // draw
        const img = m.frames[m.frameIndex];
        ctx.drawImage(img, m.x, m.y, MEDAL_SIZE, MEDAL_SIZE);
        // remove if off-screen
        if (m.x + MEDAL_SIZE < 0) state.current.medals.splice(idx, 1);
      });

      // ─── DRAW & MOVE POWERUPS ───────────────────────────────────────────────
      state.current.powerups.forEach((p, i) => {
        if (!p.collected) {
          // move left with the ground/enemies
          p.x -= state.current.groundSpeed(state.current.frameCount);
          // size them to 32×32 (or whatever you prefer)
          const S = 128;
          ctx.drawImage(p.img, p.x, p.y, S, S);
          // remove if off-screen
          if (p.x + S < 0) {
            state.current.powerups.splice(i, 1);
          }
        }
      });

      if (state.current.isActive("supermag", state.current.frameCount)) {
        // Ducks: pull in & score
        state.current.ducks = state.current.ducks.filter((d) => {
          const dx = planeCenter.x - (d.x + d.width / 2);
          const dy = planeCenter.y - (d.y + d.height / 2);

          // lerp toward plane
          if (Math.hypot(dx, dy) < 500) {
            d.x += dx * 0.1;
            d.y += dy * 0.1;
          }

          // collect when touching
          const duckScale = state.current.isActive(
            "megaducks",
            state.current.frameCount
          )
            ? 2.5
            : 1;
          const wScaled = d.width * duckScale;
          const hScaled = d.height * duckScale;
          const offX = (wScaled - d.width) / 2;
          const offY = (hScaled - d.height) / 2;
          const bx = d.x - offX;
          const by = d.y - offY;

          if (
            planeCenter.x > bx &&
            planeCenter.x < bx + wScaled &&
            planeCenter.y > by &&
            planeCenter.y < by + hScaled
          ) {
            changeScore(SCORE_DUCK);
            state.current.floatingScores.push({
              x: d.x + d.width / 2,
              y: d.y + d.height / 2,
              vy: -1,
              amount: SCORE_DUCK,
              age: 0,
              maxAge: 60,
            });
            state.current.duckCount++;
            return false; // remove
          }
          return true;
        });

        // Powerups: pull in & auto-collect
        state.current.powerups = state.current.powerups.filter((p) => {
          // never pull or collect anti-powerups under supermag
          if (ANTI_POWERUP_TYPES.includes(p.type as AntiPowerupType)) {
            // just let them drift by normally
            return true;
          }

          const dx = planeCenter.x - (p.x + 32);
          const dy = planeCenter.y - (p.y + 32);

          if (Math.hypot(dx, dy) < 500) {
            p.x += dx * 0.1;
            p.y += dy * 0.1;
          }

          if (
            planeCenter.x > p.x &&
            planeCenter.x < p.x + 64 &&
            planeCenter.y > p.y &&
            planeCenter.y < p.y + 64
          ) {
            // activate immediately
            state.current.activePowerups[p.type].expires =
              state.current.frameCount + POWERUP_DURATION;
            play("powerupSfx");
            state.current.floatingScores.push({
              x: p.x + 32,
              y: p.y + 32,
              vy: -1,
              amount: SCORE_RELOAD, // or bonus?
              age: 0,
              maxAge: 60,
            });
            return false;
          }
          return true;
        });
      }

      // ground scrolling
      // always scroll ground, even after crash
      state.current.groundOffset =
        (state.current.groundOffset +
          state.current.groundSpeed(state.current.frameCount)) %
        tileW;

      const explosionImgs = getImg("explosionImgs") as HTMLImageElement[];

      // ─── ground-contact penalty ───────────────────────────────────────────
      if (!state.current.crashed && state.current.y + PLANE_HEIGHT >= groundY) {
        state.current.groundContactFrames++;
        // every ~180 frames (~3 s at 60fps)
        if (state.current.groundContactFrames >= 180) {
          state.current.groundContactFrames = 0;
          // play crunch
          play("groundTouchSfx");
          // deduct and warn
          changeScore(-100);

          // big warning
          makeText(
            "SHOOT PLANE TO FLY",
            1.5,
            true,
            true,
            100,
            dims.height / 2,
            60
          );

          // little “OUCH” right above the plane
          makeText(
            "OUCH",
            0.5,
            /* fixed = */ true,
            true,
            PLANE_OFFSET_X + PLANE_WIDTH / 2 - 20,
            state.current.y - 30,
            30
          );
          // pick a random explosion frame and start the wiggle
          state.current.ouchExplodeIdx = Math.floor(
            Math.random() * explosionImgs.length
          );
          state.current.ouchFrames = 30;
        }
      } else {
        state.current.groundContactFrames = 0;
      }

      for (let x = -state.current.groundOffset; x < width; x += tileW) {
        ctx.drawImage(
          groundImgs[state.current.groundIndex],
          x,
          groundY,
          tileW,
          50
        );
      }

      // draw player plane with animated propeller
      if (!state.current.crashed) {
        // if OUCH is active, draw that explosion frame above the plane
        if (state.current.ouchFrames > 0) {
          const eimg = explosionImgs[state.current.ouchExplodeIdx];
          const px = PLANE_OFFSET_X;
          const py = state.current.y;

          // center it on the nose
          ctx.drawImage(
            eimg,
            px + PLANE_WIDTH / 2 - eimg.width / 2,
            py - eimg.height,
            PLANE_WIDTH / 2,
            PLANE_HEIGHT / 2
          );
        }

        // if we’re in an OUCH wiggle period, pick a small random offset
        let wiggleX = 0,
          wiggleY = 0;
        if (state.current.ouchFrames > 0) {
          wiggleX = (Math.random() - 0.5) * 10; // +/-5px
          wiggleY = (Math.random() - 0.5) * 6; // +/-3px
          state.current.ouchFrames--;
        }

        // advance propeller frame every 6 game ticks
        state.current.planeFrameCounter++;
        if (state.current.planeFrameCounter >= 6) {
          state.current.planeFrameCounter = 0;
          state.current.planeFrame =
            (state.current.planeFrame + 1) % planeFrames.length;
        }
        const frameImg = planeFrames[state.current.planeFrame];
        // apply wiggle offsets
        const cx = PLANE_OFFSET_X + PLANE_WIDTH / 2 + wiggleX;
        const cy = state.current.y + PLANE_HEIGHT / 2 + wiggleY + 10;
        ctx.save();
        ctx.translate(cx, cy);

        // draw the shield “flash” only while our counter is active
        if (
          state.current.isActive("shield", state.current.frameCount) ||
          state.current.shieldFlash > 0
        ) {
          if (state.current.shieldFlash > 0) {
            ctx.globalAlpha = state.current.shieldFlash % 2 === 0 ? 0.2 : 0.6;
          }

          const CIRCLE_SIZE = PLANE_WIDTH * 1.75;
          ctx.drawImage(
            getImg("shieldImg") as HTMLImageElement,
            -CIRCLE_SIZE / 2,
            -CIRCLE_SIZE / 2,
            CIRCLE_SIZE,
            CIRCLE_SIZE
          );

          if (state.current.shieldFlash > 0) {
            ctx.globalAlpha = 1;
            state.current.shieldFlash--;
          }
        }

        ctx.rotate(state.current.planeAngle);
        if (state.current.isActive("ghost", state.current.frameCount)) {
          ctx.globalAlpha = 0.4; // faded
        }
        ctx.drawImage(
          frameImg,
          -PLANE_WIDTH / 2,
          -PLANE_HEIGHT / 2,
          PLANE_WIDTH,
          PLANE_HEIGHT
        );
        // restore full opacity:
        ctx.globalAlpha = 1;
        ctx.restore();
        state.current.planeAngle = Math.min(0, state.current.planeAngle + 0.02);

        state.current.ouchFrames--;
      }

      // ─── UPDATE & DRAW ARTILLERY SHELLS ────────────────────────────────
      state.current.artilleryShells = state.current.artilleryShells.filter(
        (shell) => {
          // move
          shell.x += shell.vx;
          shell.y += shell.vy;

          // compute heading
          const angle = Math.atan2(shell.vy, shell.vx);

          // preserve aspect ratio of your sprite (so tail isn't squeezed), and
          // scale its height to ARTILLERY_SHELL_SIZE
          const img = shell.img as HTMLImageElement;
          const scale = ARTILLERY_SHELL_SIZE / img.naturalHeight;
          const drawW = img.naturalWidth * scale;
          const drawH = ARTILLERY_SHELL_SIZE;

          // pick a pivot so that you rotate around the *nose* of the shell.
          // headPivotX is the fraction of the width (0=left edge; 1=right edge)
          // where the bullet’s head lives. 0.8 is a good starting point for a
          // tail that takes up ~20% of the sprite’s left side:
          const headPivotX = 0.8;
          const offsetX = drawW * headPivotX;
          const offsetY = drawH / 2;

          ctx.save();
          // move the canvas origin to the shell’s center-point
          ctx.translate(shell.x, shell.y);
          // rotate so “right” points along the velocity vector
          ctx.rotate(angle);
          // draw the full sprite so that its nose sits at (0,0) in rotated space
          ctx.drawImage(img, -offsetX, -offsetY, drawW, drawH);
          ctx.restore();

          let removed = false;

          // 1) ground / water collision
          if (shell.y >= groundY) {
            const tileW = waterImgs[0].width * 0.5;
            const hitWater = state.current.waters.some(
              (w) => shell.x >= w.x && shell.x <= w.x + w.size * tileW
            );
            if (!hitWater) {
              // explode on ground
              explosionImgs.forEach((img, i) =>
                setTimeout(() => {
                  state.current.puffs.push({
                    x: shell.x - 16,
                    y: groundY - 16,
                    img,
                    vy: 0,
                    age: 0,
                    maxAge: 10,
                    size: 32 * 3,
                  });
                }, i * 50)
              );
              play("artilleryExplodeSfx");
            } else {
              // hit water, so splash
              play("artillerySplashSfx");
            }
            removed = true;
          }

          // 2) enemy‐plane hits
          state.current.enemies.forEach((e) => {
            if (
              !removed &&
              e.alive &&
              shell.x >= e.x &&
              shell.x <= e.x + ENEMY_WIDTH &&
              shell.y >= e.y &&
              shell.y <= e.y + ENEMY_HEIGHT
            ) {
              e.alive = false;

              // 1) Score + counter
              const pts = SCORE_HIT + SCORE_ARTILLERY_BONUS;
              changeScore(pts);
              state.current.enemyCount++;

              // 2) Floating score pop-up
              state.current.floatingScores.push({
                x: shell.x,
                y: shell.y,
                vy: -1,
                amount: pts,
                age: 0,
                maxAge: 60,
              });

              // 3) Explosion effect & SFX
              explosionImgs.forEach((img, i) =>
                setTimeout(() => {
                  state.current.puffs.push({
                    x: e.x,
                    y: e.y,
                    img,
                    vy: 0,
                    age: 0,
                    maxAge: 10,
                    size: 32 * 3,
                  });
                }, i * 50)
              );
              play("artilleryExplodeSfx");

              removed = true;
            }
          });

          const duckTargetImgs = getImg("duckTargetImgs") as HTMLImageElement[];

          // 3) duck hits
          state.current.ducks.forEach((d) => {
            if (
              !removed &&
              !d.hit &&
              shell.x >= d.x &&
              shell.x <= d.x + d.width &&
              shell.y >= d.y &&
              shell.y <= d.y + d.height
            ) {
              d.hit = true;

              //0)  initialize fade‐out exactly the same way as a click‐shot duck
              d.fadeAge = 0;
              d.fadeMax = 60;
              d.targetImg = duckTargetImgs[d.srcIdx];
              state.current.shotLakes.add(d.waterRef);

              // 1) Score + counter
              const pts = SCORE_DUCK + SCORE_ARTILLERY_BONUS;
              changeScore(pts);
              state.current.duckCount++;

              // 2) Floating score pop-up
              state.current.floatingScores.push({
                x: shell.x,
                y: shell.y,
                vy: -1,
                amount: pts,
                age: 0,
                maxAge: 60,
              });

              // 3) Explosion effect & SFX
              explosionImgs.forEach((img, i) =>
                setTimeout(() => {
                  state.current.puffs.push({
                    x: d.x,
                    y: d.y,
                    img,
                    vy: 0,
                    age: 0,
                    maxAge: 10,
                    size: 32 * 3,
                  });
                }, i * 50)
              );
              play("artilleryExplodeSfx");

              removed = true;
            }
          });

          return !removed && shell.y < height + ARTILLERY_SHELL_SIZE;
        }
      );

      // ─── ARTILLERY SFX CONTROL ────────────────────────────────────────
      if (
        state.current.artilleryShells.length > 0 &&
        !state.current.artilleryPlaying &&
        !state.current.crashed
      ) {
        play("artillerySfx");
        state.current.artilleryPlaying = true;
      } else if (
        state.current.artilleryShells.length === 0 &&
        state.current.artilleryPlaying
      ) {
        pause("artillerySfx");
        state.current.artilleryPlaying = false;
      }
      if (state.current.crashed && state.current.artilleryPlaying) {
        // stop artillery SFX if we crashed
        pause("artillerySfx");
        state.current.artilleryPlaying = false;
      }

      const fireImgs = getImg("fireImgs") as HTMLImageElement[];
      // ─── UPDATE & DRAW NAPALM MISSILES ────────────────────────────────
      state.current.napalmMissiles = state.current.napalmMissiles.filter(
        (m) => {
          // move & life decrement…
          m.x += m.vx;
          m.life--;

          // tail anim…
          if (++m.tailCounter >= 5) {
            m.tailCounter = 0;
            m.tailFrame = ((m.tailFrame + 1) % fireImgs.length) as 0 | 1;
          }
          const tail = fireImgs[m.tailFrame];

          // compute travel angle
          const angle = Math.atan2(0, m.vx);

          // back‐of‐missile + extra length:
          const baseOffset = NAPALM_MISSILE_SIZE / 2;
          const backOffset = baseOffset + NAPALM_FLAME_LENGTH;
          const backX = m.x - Math.cos(angle) * backOffset;
          const backY = m.y - Math.sin(angle) * backOffset;

          ctx.save();
          ctx.translate(backX, backY);
          ctx.rotate(-Math.PI / 2);

          ctx.drawImage(
            tail,
            -tail.width / 2,
            -tail.height / 2,
            tail.width,
            tail.height
          );

          ctx.restore();

          // draw the missile…
          ctx.save();
          ctx.translate(m.x, m.y);
          ctx.rotate(angle);
          ctx.drawImage(
            m.img,
            -NAPALM_MISSILE_SIZE / 2,
            -NAPALM_MISSILE_SIZE / 2,
            NAPALM_MISSILE_SIZE,
            NAPALM_MISSILE_SIZE
          );
          ctx.restore();

          if (!NAPALM_EXPLODE_NOT_DROP) {
            // original periodic drop
            m.dropTimer--;
            if (m.dropTimer <= 0 && m.dropsRemaining > 0) {
              state.current.napalmTiles.push({
                x: m.x,
                y: m.y,
                vy: 0,
                life: NAPALM_BURN_DURATION,
                maxLife: NAPALM_BURN_DURATION,
                killsPlayer: false,
              });
              m.dropsRemaining--;
              m.dropTimer = NAPALM_DROP_INTERVAL;
            }
            return m.life > 0 && m.x < width + NAPALM_MISSILE_SIZE;
          } else {
            // ─── check for explosion-on-impact or on-distance ───────────────────────
            let impact = false;
            for (const e of state.current.enemies) {
              if (
                e.alive &&
                m.x >= e.x &&
                m.x <= e.x + ENEMY_WIDTH &&
                m.y >= e.y &&
                m.y <= e.y + ENEMY_HEIGHT
              ) {
                impact = true;
                e.alive = false; // kill the plane
                changeScore(SCORE_HIT); // award points
                state.current.floatingScores.push({
                  x: e.x + ENEMY_WIDTH / 2,
                  y: e.y + ENEMY_HEIGHT / 2,
                  vy: -1,
                  amount: SCORE_HIT,
                  age: 0,
                  maxAge: 60,
                });
                break;
              }
            }

            // explode once at a random X‐position or on impact
            if (impact || m.x >= m.explodeX) {
              spawnNapalmEllipse(m.x, m.y, false);
              return false; // remove the missile once it’s done
            }
            return m.life > 0 && m.x < width + NAPALM_MISSILE_SIZE;
          }
        }
      );

      // ─── UPDATE & DRAW NAPALM FIRE TILES ─────────────────────────────
      const enemyNapalmExplosionsToDraw: { x: number; y: number }[] = [];

      state.current.napalmTiles = state.current.napalmTiles.filter((t) => {
        // move left with the ground
        t.x -= state.current.groundSpeed(state.current.frameCount);

        // have we hit (or gone below) the ground?
        const landedOnGround = t.y + NAPALM_TILE_SIZE / 2 - 30 >= groundY;

        // have we actually fallen into the *surface* of a lake?
        // (i.e. x overlaps AND our bottom is at or below the water surface)
        const tileW = waterImgs[0].width * 0.5;
        const tileH = waterImgs[0].height * 0.5;
        const waterSurfaceY = groundY - tileH + 120; // must match your draw logic

        const landedInWater = state.current.waters.some((w) => {
          const startX = w.x;
          const endX = w.x + w.size * tileW;
          return (
            t.x >= startX &&
            t.x <= endX &&
            t.y + NAPALM_TILE_SIZE / 2 >= waterSurfaceY
          );
        });

        if (!landedOnGround && !landedInWater) {
          // still dropping
          t.vy += gravity;
          t.y += t.vy;
        } else {
          // stick to whichever surface we hit…
          if (landedOnGround) {
            t.y = groundY - NAPALM_TILE_SIZE / 2 + 30;
          } else {
            // landedInWater
            t.y = waterSurfaceY - NAPALM_TILE_SIZE / 2;
          }
          t.vy = 0;
        }

        t.life--;

        const flameImgs = getImg("flameImgs") as HTMLImageElement[];
        // draw flame by stepping through the 4 images over the tile’s lifetime:
        const frames = flameImgs.length; // e.g. 4
        const age = t.maxLife - t.life; // how long it’s been burning
        const pct = age / t.maxLife; // [0..1) over the whole life
        const idx = Math.floor(pct * frames) % frames; // 0,1,2,3 in turn
        const flame = flameImgs[idx];

        const alpha = t.life / t.maxLife;
        ctx.globalAlpha = alpha;
        ctx.drawImage(
          flame,
          t.x - NAPALM_TILE_SIZE / 2,
          t.y - NAPALM_TILE_SIZE / 2,
          NAPALM_TILE_SIZE,
          NAPALM_TILE_SIZE
        );
        ctx.globalAlpha = 1;

        // — DUCKS & ENEMIES & MEDALS TURN TO NAPALM TILES —
        state.current.ducks = state.current.ducks.filter((d) => {
          if (
            !d.hit &&
            t.x >= d.x &&
            t.x <= d.x + d.width &&
            t.y >= d.y &&
            t.y <= d.y + d.height
          ) {
            // award duck score
            changeScore(SCORE_DUCK);
            state.current.floatingScores.push({
              x: d.x + d.width / 2,
              y: d.y + d.height / 2,
              vy: -1,
              amount: SCORE_DUCK,
              age: 0,
              maxAge: 60,
            });
            // spawn a stuck napalm tile at duck’s center
            state.current.napalmTiles.push({
              x: d.x + d.width / 2,
              y: d.y + d.height / 2,
              vy: 0,
              life: NAPALM_BURN_DURATION,
              maxLife: NAPALM_BURN_DURATION,
              killsPlayer: false,
            });

            if (!state.current.shotLakes.has(d.waterRef)) {
              state.current.shotLakes.add(d.waterRef); // mark lake as shot
            }

            return false; // remove the duck
          }
          return true;
        });

        state.current.enemies = state.current.enemies.filter((e) => {
          if (
            e.alive &&
            t.x >= e.x &&
            t.x <= e.x + ENEMY_WIDTH &&
            t.y >= e.y &&
            t.y <= e.y + ENEMY_HEIGHT
          ) {
            // 1) Score + floating text
            changeScore(SCORE_HIT);
            state.current.floatingScores.push({
              x: e.x + ENEMY_WIDTH / 2,
              y: e.y + ENEMY_HEIGHT / 2,
              vy: -1,
              amount: SCORE_HIT,
              age: 0,
              maxAge: 60,
            });

            // 2) **spawn the ellipse** at the plane’s center:
            const cx = e.x + ENEMY_WIDTH / 2;
            const cy = e.y + ENEMY_HEIGHT / 2;
            enemyNapalmExplosionsToDraw.push({ x: cx, y: cy });

            // 3) kill the enemy
            return false;
          }
          return true;
        });

        state.current.medals = state.current.medals.filter((m) => {
          if (
            t.x >= m.x &&
            t.x <= m.x + MEDAL_SIZE &&
            t.y >= m.y &&
            t.y <= m.y + MEDAL_SIZE
          ) {
            // award medal score
            changeScore(MEDAL_SCORE);
            state.current.floatingScores.push({
              x: m.x + MEDAL_SIZE / 2,
              y: m.y + MEDAL_SIZE / 2,
              vy: -1,
              amount: MEDAL_SCORE,
              age: 0,
              maxAge: 60,
            });
            // stick tile
            state.current.napalmTiles.push({
              x: m.x + MEDAL_SIZE / 2,
              y: m.y + MEDAL_SIZE / 2,
              vy: 0,
              life: NAPALM_BURN_DURATION,
              maxLife: NAPALM_BURN_DURATION,
              killsPlayer: false,
            });
            return false;
          }
          return true;
        });

        // Red-airship napalm collision with player:
        if (
          t.killsPlayer &&
          !state.current.isActive("ghost", state.current.frameCount) &&
          !state.current.crashed &&
          t.x >= PLANE_OFFSET_X &&
          t.x <= PLANE_OFFSET_X + PLANE_WIDTH &&
          t.y >= state.current.y &&
          t.y <= state.current.y + PLANE_HEIGHT
        ) {
          if (state.current.isActive("shield", state.current.frameCount)) {
            // consume shield
            state.current.activePowerups.shield.expires = 0;
            state.current.shieldFlash = 10;
            play("shieldSfx");
          } else {
            state.current.crashed = true;
            play("crashSfx");
            pause("flightSfx");
          }
        }

        // no longer auto‐remove on water collision here
        return t.life > 0;
      });

      enemyNapalmExplosionsToDraw.forEach(({ x: cx, y: cy }) => {
        // spawn the napalm ellipse at cx,cy
        // 1) spawn the ellipse
        spawnNapalmEllipse(cx, cy, false);
      });

      // ─── UPDATE & DRAW HOMING MISSILES ─────────────────────────────────
      state.current.homingMissiles = state.current.homingMissiles.filter(
        (m) => {
          // track or fly straight
          if (m.target) {
            const tx = ("x" in m.target ? m.target.x : 0) + ENEMY_WIDTH / 2;
            const ty = ("y" in m.target ? m.target.y : 0) + ENEMY_HEIGHT / 2;
            const angle = Math.atan2(ty - m.y, tx - m.x);
            m.vx = HOMING_MISSILE_SPEED * Math.cos(angle);
            m.vy = HOMING_MISSILE_SPEED * Math.sin(angle);
          } else {
            m.vx = HOMING_MISSILE_SPEED;
            m.vy = 0;
          }
          m.x += m.vx;
          m.y += m.vy;
          // tail anim
          if (++m.tailCounter >= 5) {
            m.tailCounter = 0;
            m.tailFrame = ((m.tailFrame + 1) % 2) as 0 | 1;
          }

          // draw tail **behind** missile along its velocity vector
          const fimg = fireImgs[m.tailFrame];
          // compute heading
          const ang = Math.atan2(m.vy, m.vx);
          // tail origin just behind the missile
          const backX = m.x - Math.cos(ang) * (HOMING_MISSILE_SIZE / 2);
          const backY = m.y - Math.sin(ang) * (HOMING_MISSILE_SIZE / 2);
          ctx.save();
          ctx.translate(backX, backY);
          ctx.rotate(ang + Math.PI); // point fire opposite flight
          // draw the fire sprite centered
          ctx.drawImage(
            fimg,
            -fimg.width / 2,
            -fimg.height / 2,
            fimg.width,
            fimg.height
          );
          ctx.restore();
          // draw missile
          ctx.save();
          ctx.translate(m.x, m.y);
          ctx.rotate(Math.atan2(m.vy, m.vx));
          ctx.drawImage(
            m.img,
            -HOMING_MISSILE_SIZE / 2,
            -HOMING_MISSILE_SIZE / 2,
            HOMING_MISSILE_SIZE,
            HOMING_MISSILE_SIZE
          );
          ctx.restore();

          // collision
          for (const e of state.current.enemies) {
            if (
              e.alive &&
              m.x >= e.x &&
              m.x <= e.x + ENEMY_WIDTH &&
              m.y >= e.y &&
              m.y <= e.y + ENEMY_HEIGHT
            ) {
              e.alive = false;
              play("homingExplSfx");

              const amount = SCORE_HIT + SCORE_HOMING_BONUS;
              changeScore(amount);

              state.current.floatingScores.push({
                x: m.x + PLANE_HEIGHT / 2,
                y: m.y + PLANE_WIDTH / 2,
                vy: -1,
                amount,
                age: 0,
                maxAge: 60,
              });

              state.current.enemyCount++;

              // spawn a little explosion
              // 2) Fire explosion frames
              const explosionSize = 32 * 3;
              explosionImgs.forEach((img, idx) =>
                setTimeout(() => {
                  state.current.puffs.push({
                    x: m.x + PLANE_HEIGHT / 2,
                    y: m.y + PLANE_WIDTH / 2,
                    img,
                    vy: 0,
                    age: 0,
                    maxAge: 10,
                    size: explosionSize,
                  });
                }, idx * 50)
              );

              return false;
            }
          }
          // lifetime out
          if (--m.life <= 0) {
            play("homingExplSfx");
            return false;
          }
          return true;
        }
      );

      // missile thruster SFX on/off
      if (
        (state.current.homingMissiles.length > 0 ||
          state.current.napalmMissiles.length > 0) &&
        !state.current.missileThrusterPlaying
      ) {
        play("thrusterSfx");
        state.current.missileThrusterPlaying = true;
      } else if (
        state.current.homingMissiles.length === 0 &&
        state.current.napalmMissiles.length === 0 &&
        state.current.missileThrusterPlaying
      ) {
        pause("thrusterSfx");
        state.current.missileThrusterPlaying = false;
      }

      // bomb: if just activated this frame:
      if (
        state.current.activePowerups.bomb.expires ===
          state.current.frameCount ||
        state.current.activePowerups.bomb.expires === state.current.frameCount
      ) {
        // explode all enemies:
        state.current.enemies.forEach((e) => {
          e.alive = false;
          // spawn a puff or explosion at e.x,e.y…
          for (let i = 0; i < SMOKE_TRAIL_COUNT; i++) {
            setTimeout(
              () =>
                spawnCrashSmokeOne(
                  e.x + ENEMY_WIDTH / 2,
                  e.y + ENEMY_HEIGHT / 2
                ),
              i * 50
            );
          }
        });

        // play explosion sound
        play("bombSfx");

        // screen shake:
        state.current.screenShake = 20;
      }

      // ─── draw any “knocked” enemies falling ─────────────────────────────────
      state.current.falling.forEach((f, idx) => {
        f.vy += gravity;
        f.y += f.vy;

        const cxF = f.x + ENEMY_WIDTH / 2;
        const cyF = f.y + ENEMY_HEIGHT / 2;
        const drawW = ENEMY_WIDTH * enemyScale;
        const drawH = ENEMY_HEIGHT * enemyScale;

        ctx.save();
        ctx.translate(cxF, cyF);
        ctx.scale(-1, 1);
        ctx.drawImage(f.img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
        // trailing smoke while falling
        if (Math.random() < 0.1) spawnCrashSmokeOne(cxF, cyF);
        // once it hits ground, spawn a puff cloud and remove
        if (f.y + ENEMY_HEIGHT >= groundY) {
          for (let i = 0; i < SMOKE_TRAIL_COUNT; i++) {
            setTimeout(() => spawnCrashSmokeOne(cxF, groundY), i * 100);
          }
          state.current.falling.splice(idx, 1);
        }
      });

      // ─── UPDATE & DRAW CANNONBALLS, CHECK COLLISIONS ──────────────────────
      state.current.cannonballs.forEach((cb, i) => {
        cb.x += cb.vx;
        // draw it
        ctx.drawImage(cb.img, cb.x, cb.y, 16, 16);
        // check against every alive enemy
        state.current.enemies.forEach((e) => {
          if (
            e.alive &&
            cb.x >= e.x &&
            cb.x <= e.x + ENEMY_WIDTH &&
            cb.y >= e.y &&
            cb.y <= e.y + ENEMY_HEIGHT
          ) {
            // hit!
            e.alive = false;
            // spawn a little explosion
            // 2) Fire explosion frames
            const explosionSize = 32 * 3;
            explosionImgs.forEach((img, idx) =>
              setTimeout(() => {
                state.current.puffs.push({
                  x: cb.x - 16,
                  y: cb.y - 16,
                  img,
                  vy: 0,
                  age: 0,
                  maxAge: 10,
                  size: explosionSize,
                });
              }, idx * 50)
            );

            const score = SCORE_HIT + SCORE_MACHINE_GUN_BONUS;
            // award points
            changeScore(score);

            state.current.floatingScores.push({
              x: cb.x + PLANE_HEIGHT / 2,
              y: cb.y + PLANE_WIDTH / 2,
              vy: -1,
              amount: score,
              age: 0,
              maxAge: 60,
            });

            // remove this cannonball
            state.current.cannonballs.splice(i, 1);
          }
        });
        // remove if off-screen
        if (cb.x > width + 50) state.current.cannonballs.splice(i, 1);
      });

      // ─── UPDATE & DRAW LASER BEAMS ─────────────────────────────────────
      const laserImgs = getImg("laserBeamImgs") as HTMLImageElement[];
      state.current.laserBeams = state.current.laserBeams.filter((b) => {
        b.x += LASER_BEAM_SPEED;
        if (++b.frameCounter >= 4) {
          b.frameCounter = 0;
          b.frame = ((b.frame + 1) % laserImgs.length) as 0 | 1;
        }
        const img = laserImgs[b.frame];
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
        ctx.restore();

        state.current.enemies.forEach((e) => {
          if (
            e.alive &&
            b.x >= e.x &&
            b.x <= e.x + ENEMY_WIDTH &&
            b.y >= e.y &&
            b.y <= e.y + ENEMY_HEIGHT
          ) {
            e.alive = false;
            changeScore(SCORE_HIT);
            state.current.floatingScores.push({
              x: e.x + ENEMY_WIDTH / 2,
              y: e.y + ENEMY_HEIGHT / 2,
              vy: -1,
              amount: SCORE_HIT,
              age: 0,
              maxAge: 60,
            });
            state.current.enemyCount++;
          }
        });
        return b.x < width + 50;
      });

      // trailing smoke after ground crash
      if (state.current.crashed && state.current.groundCrashPuffsLeft > 0) {
        spawnCrashSmokeOne(PLANE_OFFSET_X, state.current.y + PLANE_HEIGHT / 2);
        state.current.groundCrashPuffsLeft--;
      }

      // animate + draw smoke puffs
      const next: Puff[] = [];
      state.current.puffs.forEach((p) => {
        // move it upward by its vy
        p.y += p.vy;
        ctx.globalAlpha = 1 - p.age / p.maxAge;
        // if a custom size was set (for explosions), use it
        const drawSize = p.size ?? 32;
        ctx.drawImage(p.img, p.x, p.y, drawSize, drawSize);
        ctx.globalAlpha = 1;
        p.age++;
        if (p.age < p.maxAge) next.push(p);
      });
      state.current.puffs = next;

      // animate + draw floating scores
      state.current.floatingScores.forEach((fs) => {
        const alpha = 1 - fs.age / fs.maxAge;
        ctx.globalAlpha = alpha;
        // plus sign
        ctx.drawImage(
          getImg("plusImg") as HTMLImageElement,
          fs.x - 16,
          fs.y - 64,
          32,
          32
        );
        // digits
        let dx = fs.x + 18;
        if (fs.amount != undefined) {
          fs.amount
            .toString()
            .split("")
            .forEach((ch) => {
              const digitImgs = getImg("digitImgs") as Record<
                string,
                HTMLImageElement
              >;
              const img = digitImgs[ch];
              if (img) {
                ctx.drawImage(
                  img,
                  dx,
                  fs.y - 64,
                  SCORE_DIGIT_WIDTH,
                  SCORE_DIGIT_HEIGHT
                );
                dx += SCORE_DIGIT_WIDTH + 2;
              }
            });
        }

        if (state.current.isActive("coin2x", state.current.frameCount)) {
          const powerupImgs = getImg("powerupImgs") as Record<
            string,
            HTMLImageElement
          >;
          // after pushing +final, also push a little coin2x sprite
          ctx.drawImage(
            powerupImgs.coin2x,
            dx,
            fs.y - 64,
            SCORE_DIGIT_HEIGHT,
            SCORE_DIGIT_HEIGHT
          );
        }

        // move & age
        fs.y += fs.vy;
        fs.age++;
      });
      state.current.floatingScores = state.current.floatingScores.filter(
        (fs) => fs.age < fs.maxAge
      );
      ctx.globalAlpha = 1;

      // randomly spawn water tiles (always spawn one duck per new lake)
      if (Math.random() < WATER_SPAWN_PROB) {
        const newLake = makeRandomWater(width, groundY);

        // avoid overlapping existing lakes
        const tileW = waterImgs[0].width * 0.5;
        const tileH = waterImgs[0].height * 0.5;

        const lakeStart = newLake.x;
        const lakeEnd = newLake.x + newLake.size * tileW;
        const overlap = state.current.waters.some((w) => {
          const wStart = w.x;
          const wEnd = w.x + w.size * tileW;
          return lakeStart < wEnd && wStart < lakeEnd;
        });
        if (!overlap) {
          state.current.waters.push(newLake);

          const duckImgs = getImg("duckImgs") as HTMLImageElement[];
          const duckTargetImgs = getImg("duckTargetImgs") as HTMLImageElement[];
          const duckOutlineImgs = getImg(
            "duckOutlineImgs"
          ) as HTMLImageElement[];

          // choose a random duck sprite and remember its index
          const srcIdx = Math.floor(Math.random() * duckImgs.length);
          const tileIndex = Math.floor(Math.random() * newLake.size);
          const img = duckImgs[srcIdx];

          // water is drawn at 50% scale
          const duckW = img.width * 0.5;
          const duckH = img.height * 0.5;

          // compute the same Y-offset you use when drawing water tiles
          // place the lake flush on the ground
          const waterDrawY = groundY - tileH + 100;

          state.current.ducks.push({
            // place duck on a random tile
            x: newLake.x + tileIndex * tileW,
            y: waterDrawY - duckH,
            img,
            targetImg: duckTargetImgs[srcIdx],
            outlineImg: duckOutlineImgs[srcIdx],
            width: duckW,
            height: duckH,
            srcIdx, // store index for target overlay
            bobPhase: Math.random() * Math.PI * 2,
            // swim back & forth:
            vx: 1.5, // adjust speed to taste
            dir: Math.random() < 0.5 ? 1 : -1,
            waterRef: newLake,
          });
        }
      }

      // draw + animate water tiles
      state.current.waters.forEach((w, idx) => {
        // advance animation
        w.frameCounter++;
        if (w.frameCounter >= w.frameRate) {
          w.frameCounter = 0;
          w.frameIndex = w.frameIndex === 0 ? 1 : 0;
        }

        // draw each tile at 75% scale so they sit just above the ground
        const img = waterImgs[w.frameIndex];
        const tileW = img.width * 0.5;
        const tileH = img.height * 0.5;
        for (let i = 0; i < w.size; i++) {
          // draw each tile so it sits just above the ground
          ctx.drawImage(
            img,
            w.x + i * tileW,
            groundY - tileH + 100,
            tileW,
            tileH
          );
        }

        // scroll along with the ground
        w.x -= state.current.groundSpeed(state.current.frameCount);

        // remove once off–screen
        if (w.x + w.size * tileW + canvas.width < 0)
          state.current.waters.splice(idx, 1);
      });

      // --- reconciliation: ensure every lake has at least one duck ---
      if (
        !state.current.isActive("supermag", state.current.frameCount) &&
        !state.current.isActive("napalm", state.current.frameCount) &&
        !state.current.crashed
      ) {
        state.current.waters.forEach((lake) => {
          const hasDuck = state.current.ducks.some((d) => d.waterRef === lake);
          // only spawn a new duck if this lake has no live duck AND hasn’t been shot
          if (!hasDuck && !state.current.shotLakes.has(lake)) {
            const duckImgs = getImg("duckImgs") as HTMLImageElement[];
            const duckTargetImgs = getImg(
              "duckTargetImgs"
            ) as HTMLImageElement[];
            const duckOutlineImgs = getImg(
              "duckOutlineImgs"
            ) as HTMLImageElement[];

            const tileW = waterImgs[0].width * 0.5;
            const srcIdx = Math.floor(Math.random() * duckImgs.length);
            const img = duckImgs[srcIdx];
            const duckW = img.width * 0.5;
            const duckH = img.height * 0.5;
            // center the duck on the lake
            const midX = lake.x + (lake.size * tileW - duckW) / 2;
            const duckY = groundY - duckH;
            state.current.ducks.push({
              x: midX,
              y: duckY,
              img,
              targetImg: duckTargetImgs[srcIdx],
              outlineImg: duckOutlineImgs[srcIdx],
              width: duckW,
              height: duckH,
              srcIdx,
              bobPhase: Math.random() * Math.PI * 2,
              vx: 1.5,
              dir: Math.random() < 0.5 ? 1 : -1,
              waterRef: lake,
            });
          }
        });
      }

      // draw ducks and scroll them
      state.current.ducks.forEach((d, i) => {
        // 1) move with the ground scroll
        d.x -= state.current.groundSpeed(state.current.frameCount);

        // compute bobbed Y for floating ducks on water
        let drawY = d.y;
        // if the duck is on water, bob it up and down if not shot or supermagnet
        if (
          !d.hit &&
          !state.current.isActive("supermag", state.current.frameCount)
        ) {
          const bob =
            Math.sin(state.current.frameCount * 0.05 + d.bobPhase) * 5;
          drawY += bob + 20;
        }

        // swimming logic (only if not shot) and not supermagnet
        if (
          !d.hit &&
          !state.current.isActive("supermag", state.current.frameCount)
        ) {
          // recompute the lake’s current edges
          const tileW = waterImgs[0].width * 0.5;
          const left = d.waterRef.x;
          const right = d.waterRef.x + d.waterRef.size * tileW;

          // swim (adds on top of the scroll we already did)
          d.x += d.vx * d.dir;

          // bounce off the moving bounds
          if (d.x <= left) {
            d.x = left;
            d.dir = 1;
          } else if (d.x + d.width >= right) {
            d.x = right - d.width;
            d.dir = -1;
          }
        }

        const isMega = state.current.isActive(
          "megaducks",
          state.current.frameCount
        );
        drawY = isMega ? drawY - 20 : drawY; // adjust Y for mega ducks
        const scale = isMega
          ? DUCK_MAGNIFY_SCALE
          : state.current.isActive("ducksight", state.current.frameCount)
          ? DUCKSIGHT_MAGNIFY_SCALE
          : 1;
        const sw = d.width * scale;
        const sh = d.height * scale;
        const dx = d.x - (sw - d.width) / 2;
        const dy = drawY - (sh - d.height) / 2;

        // if this duck was hit, we draw the target overlay instead
        if (d.hit && d.targetImg) {
          const alpha = 1 - d.fadeAge! / d.fadeMax!;
          ctx.globalAlpha = alpha;
          // small rise
          d.y -= 0.5;

          // draw with the same facing (flip if dir<0)
          ctx.save();
          if (d.dir < 0) {
            ctx.translate(dx + sw / 2, dy + sh / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(d.targetImg!, -sw / 2, -sh / 2, sw, sh);
          } else {
            ctx.drawImage(d.targetImg!, dx, dy, sw, sh);
          }
          ctx.restore();
          ctx.restore();

          d.fadeAge!++;
          // once fully faded, remove from array
          if (d.fadeAge! >= d.fadeMax!) state.current.ducks.splice(i, 1);
          ctx.globalAlpha = 1;
        } else {
          const isSight = state.current.isActive(
            "ducksight",
            state.current.frameCount
          );

          // draw the swimming duck, flipped if dir<0
          ctx.save();
          if (d.dir < 0) {
            ctx.translate(dx + sw / 2, dy + sh / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(
              isSight ? d.outlineImg : d.img,
              -sw / 2,
              -sh / 2,
              sw,
              sh
            );
          } else {
            ctx.drawImage(isSight ? d.outlineImg : d.img, dx, dy, sw, sh);
          }
          ctx.restore();
        }

        // cleanup if they swim off-screen entirely
        if (d.x + d.width < -50 || d.x > width + 50) {
          state.current.ducks.splice(i, 1);
        }
      });

      const sparkImgs = getImg("sparkImgs") as HTMLImageElement[];
      state.current.sparkEffects.forEach((spark) => {
        spark.age++;
        spark.frameIndex = Math.floor(
          (spark.age / spark.maxAge) * sparkImgs.length
        );

        if (spark.frameIndex >= sparkImgs.length) {
          spark.frameIndex = sparkImgs.length - 1;
        }

        const img = sparkImgs[spark.frameIndex];

        ctx.save();
        ctx.globalAlpha = 0.8 - (spark.age / spark.maxAge) * 0.8; // Fade out
        ctx.filter = "hue-rotate(-30deg) brightness(1.2)";
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(img, spark.x, spark.y, 64, 128);
        ctx.restore();
      });

      // Remove expired sparks
      state.current.sparkEffects = state.current.sparkEffects.filter(
        (spark) => spark.age < spark.maxAge
      );

      // loop
      animationFrameRef.current = requestAnimationFrame(render);

      // sync ui state
      syncUIFromState();
    };
    render();
  }, [
    getImg,
    dims,
    resetState,
    play,
    syncUIFromState,
    changeScore,
    makeRandomMountainRange,
    makeRandomTree,
    makeRandomCloud,
    pause,
    spawnCrashSmokeOne,
    makeText,
    spawnNapalmEllipse,
  ]);

  // ─── START LOOP ON "playing" ─────────────────────────────────────────────
  useEffect(() => {
    if (phase === "playing" && state.current.frameCount === 0) {
      loopStartedRef.current = false; // <-- RESET guard on new game
      initLoop();

      // reset and ramp up spawn rate
      state.current.dynamicDensity = INITIAL_ENEMY_DENSITY;

      const interval = setInterval(() => {
        state.current.dynamicDensity += ENEMY_DENSITY_STEP;
      }, 45000);
      return () => clearInterval(interval);
    }
  }, [phase, initLoop]);

  // ─── CLICK TO FLAP & FIRE ─────────────────────────────────────────────────
  const handleClick = (e: React.MouseEvent) => {
    // out of play or no ammo → reload flash
    if (phase !== "playing" || ui.crashed || ui.ammo <= 0) {
      if (state.current.ammo <= 1) {
        const x = 100,
          y = dims.height / 2;
        for (let i = 0; i < 3; i++) {
          window.setTimeout(
            () => makeText("RELOAD", 2, true, true, x, y, 30),
            i * 200
          );
        }
      }
      return;
    }

    // determine spray vs single
    const isSpray = state.current.isActive("spray", state.current.frameCount);
    const decrement = isSpray
      ? Math.min(SPRAY_DECREMENTS_AMMO ? SPRAY_COUNT : 1, state.current.ammo)
      : 1;
    const newAmmo = state.current.isActive(
      "infiniteAmmo",
      state.current.frameCount
    )
      ? state.current.ammo
      : Math.max(0, state.current.ammo - decrement);

    state.current.ammo = newAmmo;
    state.current.cursor = SHOT_CURSOR;

    // reset cursor after a short delay
    setTimeout(() => (state.current.cursor = DEFAULT_CURSOR), 100);

    // compute base click coords
    const rect = canvasRef.current!.getBoundingClientRect();
    const baseX = e.clientX - rect.left,
      baseY = e.clientY - rect.top;

    if (isSpray) {
      // fire that many pellets, each random‐offset & delayed
      for (let i = 0; i < SPRAY_COUNT; i++) {
        const dx = (Math.random() * 2 - 1) * SPRAY_SPREAD;
        const dy = (Math.random() * 2 - 1) * SPRAY_SPREAD;
        window.setTimeout(
          () => doSingleShot(baseX + dx, baseY + dy),
          i * SPRAY_INTERVAL
        );
      }
    } else {
      // single shot
      doSingleShot(baseX, baseY);
    }
  };

  // ─── RIGHT-CLICK TO RELOAD ───────────────────────────────────────────────
  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      phase === "playing" &&
      !state.current.crashed &&
      state.current.ammo < MAX_AMMO
    ) {
      play("reloadSfx");

      changeScore(SCORE_RELOAD);

      state.current.ammo = MAX_AMMO;
      state.current.floatingScores.push({
        x: Math.random() * dims.width,
        y: Math.random() * dims.height,
        vy: -1,
        amount: SCORE_RELOAD,
        age: 0,
        maxAge: 60,
      });
    }
  };

  // ─── RESET ON GAME OVER ───────────────────────────────────────────────────
  const resetGame = () => {
    play("gameOverSfx");
    startSplash();
  };

  // ─── CLEANUP ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Cancel all timers, animation frames, etc. on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // ─── PUBLIC API: EXPORTED VALUES AND CALLBACKS ───────────────
  return {
    phase,
    setPhase,
    ui,
    setUI,
    canvasRef,
    state,
    startSplash,
    handleClick,
    handleContext,
    getImg,
    isActive,
    resetGame,
    resetState,
    countdown,
  };
}

export default useGameEngine;
