// src/games/warbirds/utils.ts
import {
  drawRandomMountainRange,
  drawRandomTree,
  drawRandomCloud,
  drawRandomWater,
} from "@/utils/environment";
import { ENEMY_WIDTH, ENEMY_HEIGHT } from "@/constants/vehicles";
import {
  AIRSHIP_SPAWN_PROB,
  AIRSHIP_COLORS,
  AIRSHIP_MIN_ALT,
  AIRSHIP_MAX_ALT,
  AIRSHIP_MIN_SPEED,
  AIRSHIP_MAX_SPEED,
  AIRSHIP_SIZE,
  AIRSHIP_BOB_AMPLITUDE,
} from "@/constants/vehicles";
import {
  HOMING_MISSILE_SPAWN_RATE,
  ARTILLERY_RATE,
  ARTILLERY_SHELL_SPEED_MIN,
  ARTILLERY_SHELL_SPEED_MAX,
  ARTILLERY_SHELL_SIZE,
  MACHINE_GUN_BURST_COUNT,
  MACHINE_GUN_SHOT_INTERVAL,
  CANNONBALL_SPEED,
  NAPALM_DROP_MIN,
  NAPALM_DROP_MAX,
  NAPALM_DROP_INTERVAL,
  NAPALM_MISSILE_SIZE,
  NAPALM_MISSILE_SPEED,
  NAPALM_BEGIN_EXPLODE_X,
  NAPALM_END_EXPLODE_X,
  HOMING_MISSILE_SPEED,
  SCORE_HOMING_BONUS,
  SCORE_MACHINE_GUN_BONUS,
  POWERUP_DURATION,
} from "@/constants/powerups";
import {
  GRAVITY,
  MOUNTAIN_SCALE_MAX,
  MOUNTAIN_SCALE_MIN,
  WATER_MAX_SIZE,
  WATER_MIN_SIZE,
  WATER_SPAWN_PROB,
} from "@/constants/environment";
import { PLANE_WIDTH, PLANE_HEIGHT } from "@/constants/vehicles";
import { AudioMgr } from "@/types/audio";
import { PowerupType } from "@/types/objects";
import { AssetMgr, Dims } from "@/types/ui";
import {
  PLANE_OFFSET_X,
  MAX_AMMO,
  INITIAL_ENEMY_DENSITY,
  ENEMY_FLAP_BASE,
  ENEMY_FLAP_RANDOM,
  ENEMY_CAN_FLAP,
  ENEMY_GLIDE_PROB,
  FLAP_STRENGTH,
  SCORE_HIT,
  SKY_COLOR,
  DEFAULT_CURSOR,
  ENEMY_SPEED,
  GROUND_SPEED,
  POWERUP_DEBUG,
} from "./constants";
import { GameState } from "./types";
import { Water } from "@/types/environment";

/**
 * Initializes the entire game state to default values, precisely matching index.tsx
 */
export function initState(
  dims: Dims,
  assets: AssetMgr,
  audio: AudioMgr
): GameState {
  const activePowerups: Record<PowerupType, { expires: number }> = {
    artillery: { expires: 0 },
    bomb: { expires: 0 },
    coin2x: { expires: 0 },
    ducksight: { expires: 0 },
    freeze: { expires: 0 },
    ghost: { expires: 0 },
    gunjam: { expires: 0 },
    heavy: { expires: 0 },
    homing: { expires: 0 },
    hourglass: { expires: 0 },
    infiniteAmmo: { expires: 0 },
    machineGuns: { expires: 0 },
    megaducks: { expires: 0 },
    magnet: { expires: 0 },
    napalm: { expires: 0 },
    shield: { expires: 0 },
    shrink: { expires: 0 },
    skull: { expires: 0 },
    spray: { expires: 0 },
    sticky: { expires: 0 },
    supermag: { expires: 0 },
    thunderstrike: { expires: 0 },
    windy: { expires: 0 },
    wings: { expires: 0 },
  };

  POWERUP_DEBUG.forEach((type) => {
    activePowerups[type].expires = POWERUP_DURATION;
  });

  const isActive = (t: PowerupType, frameCount: number): boolean =>
    activePowerups[t].expires > 0 && activePowerups[t].expires > frameCount;

  return {
    dims,
    assets,
    audio,

    cursor: DEFAULT_CURSOR,

    frameCount: 0,
    gameOver: false,

    y: dims.height * 0.2,
    vy: 0,
    groundOffset: 0,

    score: 0,
    ammo: MAX_AMMO,
    medalCount: 0,
    duckCount: 0,
    enemyCount: 0,

    dynamicDensity: INITIAL_ENEMY_DENSITY,

    enemies: [],
    airships: [],
    mountains: [],
    trees: [],
    clouds: [],
    waters: [],
    shotLakes: new Set<Water>(),
    ducks: [],
    powerups: [],
    medals: [],

    cannonballs: [],
    homingMissiles: [],
    artilleryShells: [],
    napalmMissiles: [],
    napalmTiles: [],
    burstRemaining: 0,
    burstCooldown: 0,

    puffs: [],
    sparkEffects: [],
    bulletHoles: [],
    floatingScores: [],
    falling: [],

    activePowerups,
    shieldFlash: 0,
    screenShake: 0,
    thunderCooldown: 0,

    crashed: false,
    crashHandled: false,
    groundCrashPuffsLeft: 0,

    planeFrame: 0,
    planeFrameCounter: 0,
    groundIndex: 0,
    planeAngle: 0,
    smokeSpawned: false,
    groundContactFrames: 0,

    whooshPlaying: false,
    artilleryPlaying: false,
    missileThrusterPlaying: false,

    textLabels: [],
    streak: 0,
    ouchFrames: 0,
    ouchExplodeIdx: 0,

    readyTimeout: 0,
    goTimeout: 0,
    beepTimeouts: [],

    isActive,
    enemySpeed: (frameCount: number) =>
      isActive("hourglass", frameCount) ? ENEMY_SPEED * 0.5 : ENEMY_SPEED,
    groundSpeed: (frameCount: number) =>
      isActive("hourglass", frameCount) ? GROUND_SPEED * 0.5 : GROUND_SPEED,
  };
}

/** Spawns new game entities each frame (verbatim from index.tsx loop) */
export function spawnSystems(state: GameState): void {
  const { width, height } = state.dims;
  const groundY = height - 50;

  // ENEMY
  if (Math.random() < state.dynamicDensity) {
    const colorIdx = Math.floor(
      Math.random() *
        (state.assets.getImg("enemyFrames") as HTMLImageElement[][]).length
    );
    const hasStick = Math.random() < 0.25;
    let targetIdx = -1,
      targetScore = 0;
    if (hasStick) {
      targetIdx = Math.floor(Math.random() * 3);
      targetScore = [500, 250, 100][targetIdx];
    }
    const baseY = 50 + Math.random() * (height - 200);
    state.enemies.push({
      x: width + ENEMY_WIDTH,
      y: baseY,
      vy: 0,
      flapStrength: -(ENEMY_FLAP_BASE + Math.random() * ENEMY_FLAP_RANDOM),
      frames: (state.assets.getImg("enemyFrames") as HTMLImageElement[][])[
        colorIdx
      ],
      propFrame: Math.floor(Math.random() * 3),
      frameRate: 6,
      frameCounter: 0,
      alive: true,
      glide: ENEMY_CAN_FLAP ? Math.random() < ENEMY_GLIDE_PROB : true,
      loopProgress: -1,
      baseY,
      rotation: 0,
      stepProgress: -1,
      stepDelta: 0,
      hasStick,
      stickBroken: false,
      stickImg: state.assets.getImg("stickImg") as HTMLImageElement,
      brokenStickImg: state.assets.getImg("brokenStickImg") as HTMLImageElement,
      targetImg: hasStick
        ? (state.assets.getImg("targetImgs") as HTMLImageElement[])[targetIdx]
        : undefined!,
      targetType: hasStick
        ? (`red${targetIdx + 1}` as "red1" | "red2" | "red3")
        : undefined!,
      targetScore,
      targetFadeAge: 0,
      targetFadeMax: hasStick ? 60 : 0,
      targetHit: false,
      targetVy: 0,
    });
  }

  // MOUNTAINS
  if (Math.random() < 0.001) {
    const newRange = drawRandomMountainRange(
      width,
      height,
      state.assets.getImg("rockImgs") as HTMLImageElement[],
      () => state.groundSpeed(state.frameCount),
      MOUNTAIN_SCALE_MIN,
      MOUNTAIN_SCALE_MAX
    );
    state.mountains.push(...newRange);
  }

  // TREES
  if (Math.random() < 0.005) {
    state.trees.push(
      drawRandomTree(
        width,
        height,
        state.assets.getImg("treeImgs") as HTMLImageElement[],
        () => state.groundSpeed(state.frameCount)
      )
    );
  }

  // CLOUDS
  if (Math.random() < 0.0015) {
    state.clouds.push(
      drawRandomCloud(
        width,
        height,
        state.assets.getImg("whitePuffImgs") as HTMLImageElement[],
        () => state.groundSpeed(state.frameCount)
      )
    );
  }

  // AIRSHIPS
  if (Math.random() < AIRSHIP_SPAWN_PROB) {
    const color =
      AIRSHIP_COLORS[Math.floor(Math.random() * AIRSHIP_COLORS.length)];
    const altPct =
      AIRSHIP_MIN_ALT + Math.random() * (AIRSHIP_MAX_ALT - AIRSHIP_MIN_ALT);
    const speed =
      AIRSHIP_MIN_SPEED +
      Math.random() * (AIRSHIP_MAX_SPEED - AIRSHIP_MIN_SPEED);
    state.airships.push({
      x: -AIRSHIP_SIZE * 3,
      baseY: height * altPct,
      frames: (
        state.assets.getImg("airshipFrames") as Record<
          string,
          HTMLImageElement[]
        >
      )[color],
      frameIndex: Math.floor(Math.random() * 3),
      frameCounter: 0,
      frameRate: 10,
      speed,
      color,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }

  // WATER & DUCKS
  if (Math.random() < WATER_SPAWN_PROB) {
    const lake = drawRandomWater(
      width,
      groundY,
      WATER_MIN_SIZE,
      WATER_MAX_SIZE
    );
    state.waters.push(lake);
    const srcIdx = Math.floor(
      Math.random() *
        (state.assets.getImg("duckImgs") as HTMLImageElement[]).length
    );
    const img = (state.assets.getImg("duckImgs") as HTMLImageElement[])[srcIdx];
    state.ducks.push({
      x: lake.x,
      y: lake.y - img.height * 0.5 + 100,
      img,
      targetImg: (state.assets.getImg("duckTargetImgs") as HTMLImageElement[])[
        srcIdx
      ],
      outlineImg: (
        state.assets.getImg("duckOutlineImgs") as HTMLImageElement[]
      )[srcIdx],
      width: img.width * 0.5,
      height: img.height * 0.5,
      srcIdx,
      bobPhase: Math.random() * Math.PI * 2,
      vx: 1.5,
      dir: Math.random() < 0.5 ? 1 : -1,
      waterRef: lake,
      hit: false,
      fadeAge: 0,
      fadeMax: 0,
    });
  }

  // HOMING MISSILE (from powerup)
  if (
    state.activePowerups.homing.expires > state.frameCount &&
    Math.random() < HOMING_MISSILE_SPAWN_RATE
  ) {
    const target = state.enemies.find((e) => e.alive) || state.ducks[0] || null;
    if (target) {
      state.homingMissiles.push({
        x: PLANE_OFFSET_X + PLANE_WIDTH,
        y: state.y + PLANE_HEIGHT / 2,
        vx: 0,
        vy: 0,
        img: state.assets.getImg("homingImg") as HTMLImageElement,
        tailFrame: 0,
        tailCounter: 0,
        life: Math.ceil(
          (state.dims.width + NAPALM_MISSILE_SIZE) / HOMING_MISSILE_SPEED
        ),
        target,
      });
    }
  }

  // ARTILLERY (from powerup)
  if (
    state.activePowerups.artillery.expires > state.frameCount &&
    Math.random() < ARTILLERY_RATE
  ) {
    const startX = Math.random() * (width - 200) + 200;
    const θ = Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
    const speed =
      ARTILLERY_SHELL_SPEED_MIN +
      Math.random() * (ARTILLERY_SHELL_SPEED_MAX - ARTILLERY_SHELL_SPEED_MIN);
    state.artilleryShells.push({
      x: startX,
      y: -ARTILLERY_SHELL_SIZE,
      vx: Math.cos(θ) * speed,
      vy: Math.sin(θ) * speed,
      img: state.assets.getImg("artilleryImg") as HTMLImageElement,
    });
  }

  // NAPALM MISSILE (from powerup)
  if (
    state.activePowerups.napalm.expires > state.frameCount &&
    Math.random() < 0.01
  ) {
    const altPct = Math.random();
    state.napalmMissiles.push({
      x: -NAPALM_MISSILE_SIZE / 2,
      y: height * altPct,
      vx: NAPALM_MISSILE_SPEED,
      life: Math.ceil((width + NAPALM_MISSILE_SIZE) / NAPALM_MISSILE_SPEED),
      dropsRemaining:
        NAPALM_DROP_MIN +
        Math.floor(Math.random() * (NAPALM_DROP_MAX - NAPALM_DROP_MIN)),
      dropTimer: NAPALM_DROP_INTERVAL,
      img: state.assets.getImg("napalmImg") as HTMLImageElement,
      tailFrame: 0,
      tailCounter: 0,
      explodeX:
        NAPALM_BEGIN_EXPLODE_X +
        Math.random() * (NAPALM_END_EXPLODE_X - NAPALM_BEGIN_EXPLODE_X),
    });
  }

  // MACHINE GUN BURSTS (from powerup)
  if (state.activePowerups.machineGuns.expires > state.frameCount) {
    if (state.burstRemaining === 0 && Math.random() < 0.01) {
      state.burstRemaining = MACHINE_GUN_BURST_COUNT;
      state.burstCooldown = 0;
    }
    if (state.burstRemaining > 0) {
      if (state.burstCooldown === 0) {
        state.cannonballs.push({
          x: PLANE_OFFSET_X + PLANE_WIDTH,
          y: state.y + PLANE_HEIGHT / 2,
          vx: CANNONBALL_SPEED,
          img: state.assets.getImg("cannonballImg") as HTMLImageElement,
        });
        state.audio.play("cannonballSfx");
        state.burstRemaining--;
        state.burstCooldown = MACHINE_GUN_SHOT_INTERVAL;
      } else {
        state.burstCooldown--;
      }
    }
  }
}

/** Updates everything: physics, movement, collision, and state */
export function updateSystems(state: GameState): void {
  const { width, height } = state.dims;
  const groundY = height - 50;

  // Player plane physics (gravity, floor bounce)
  state.vy += GRAVITY;
  state.y += state.vy;
  if (state.y + PLANE_HEIGHT > groundY && !state.crashed) {
    state.y = groundY - PLANE_HEIGHT;
    state.vy = -FLAP_STRENGTH;
    state.audio.play?.("groundTouchSfx");
  }
  state.groundOffset =
    (state.groundOffset + state.groundSpeed(state.frameCount)) %
    (state.assets.getImg("groundImgs") as HTMLImageElement[])[state.groundIndex]
      .width;

  // Move/clean up mountains, trees, clouds, airships
  state.mountains = state.mountains.filter((m) => {
    m.x -= state.groundSpeed(state.frameCount);
    return m.x + m.width > -50;
  });
  state.trees = state.trees.filter((t) => {
    t.x -= state.groundSpeed(state.frameCount);
    return t.x + t.width > -50;
  });
  state.clouds = state.clouds.filter((c) => {
    c.x -= state.groundSpeed(state.frameCount) * 0.5;
    // Find the rightmost puff, account for its dx and width
    const lastPuff = c.puffs[c.puffs.length - 1];
    if (!lastPuff) return false;
    return c.x + lastPuff.dx + lastPuff.img.width * lastPuff.scale > -100;
  });
  state.airships = state.airships.filter((a) => {
    a.x += a.speed;
    a.frameCounter++;
    if (a.frameCounter >= a.frameRate) {
      a.frameCounter = 0;
      a.frameIndex = (a.frameIndex + 1) % a.frames.length;
    }
    return a.x < width + a.frames[a.frameIndex].width;
  });

  // Move/clean up water tiles and ducks
  const tileW =
    ((state.assets.getImg("waterImgs") as HTMLImageElement[])[0]?.width || 32) *
    0.5;
  state.waters = state.waters.filter((w) => {
    w.x -= state.groundSpeed(state.frameCount);
    return w.x + w.size * tileW > -50;
  });
  state.ducks = state.ducks.filter((d) => {
    if (!d.hit) {
      d.bobPhase += 0.05;
      d.y += Math.sin(d.bobPhase) * 0.5;
    }
    d.x += d.vx * d.dir;
    // reverse at edges
    const left = d.waterRef.x,
      right = d.waterRef.x + d.waterRef.size * tileW;
    if (d.x < left || d.x + d.width > right) d.dir *= -1;
    return d.y < height + 50;
  });

  // Puffs
  state.puffs = state.puffs.filter(
    (p) => ++p.age < p.maxAge && ((p.y += p.vy), true)
  );
  // Sparks
  state.sparkEffects = state.sparkEffects.filter((s) => {
    s.age++;
    s.frameIndex = Math.min(
      Math.floor(
        (s.age / s.maxAge) *
          (state.assets.getImg("sparkImgs") as HTMLImageElement[]).length
      ),
      (state.assets.getImg("sparkImgs") as HTMLImageElement[]).length - 1
    );
    return s.age < s.maxAge;
  });
  // Bullet holes
  state.bulletHoles = state.bulletHoles.filter((h) => ++h.age < h.maxAge);
  // Floating scores
  state.floatingScores = state.floatingScores.filter((f) => {
    f.y += f.vy;
    return ++f.age < f.maxAge;
  });
  // Falling (enemy pieces)
  state.falling = state.falling.filter((f) => {
    f.vy += GRAVITY * 0.1;
    f.y += f.vy;
    return f.y < groundY + 100;
  });

  // Cannonball projectile update and collision
  state.cannonballs = state.cannonballs.filter((cb) => {
    cb.x += cb.vx;
    state.enemies.forEach((e) => {
      if (
        e.alive &&
        cb.x >= e.x &&
        cb.x <= e.x + ENEMY_WIDTH &&
        cb.y >= e.y &&
        cb.y <= e.y + ENEMY_HEIGHT
      ) {
        e.alive = false;
        state.score += SCORE_HIT + SCORE_MACHINE_GUN_BONUS;
        state.enemyCount++;
        state.floatingScores.push({
          x: e.x + ENEMY_WIDTH / 2,
          y: e.y + ENEMY_HEIGHT / 2,
          vy: -1,
          amount: SCORE_HIT + SCORE_MACHINE_GUN_BONUS,
          age: 0,
          maxAge: 60,
        });
        state.audio.play?.("artilleryExplode");
        cb.vx = Infinity;
      }
    });
    return cb.vx < Infinity && cb.x < width + 50;
  });

  // Homing missile update and collision
  state.homingMissiles = state.homingMissiles.filter((m) => {
    if (!m.target) return false;
    const dx = m.target.x - m.x,
      dy = m.target.y - m.y,
      dist = Math.hypot(dx, dy),
      speed = HOMING_MISSILE_SPEED;
    m.vx = (dx / dist) * speed;
    m.vy = (dy / dist) * speed;
    m.x += m.vx;
    m.y += m.vy;
    m.life--;
    if (m.life <= 0 || (m.x >= m.target.x && m.y >= m.target.y)) {
      if (m.life > 0) {
        if ("hit" in m.target) {
          m.target.hit = true;
        } else if ("alive" in m.target) {
          m.target.alive = false;
        }
        state.score += SCORE_HIT + SCORE_HOMING_BONUS;
        state.enemyCount++;
        state.floatingScores.push({
          x: m.x,
          y: m.y,
          vy: -1,
          amount: SCORE_HIT + SCORE_HOMING_BONUS,
          age: 0,
          maxAge: 60,
        });
        state.audio.play?.("homingExplode");
      }
      return false;
    }
    return true;
  });

  // Artillery shell movement and ground impact
  state.artilleryShells = state.artilleryShells.filter((s) => {
    s.x += s.vx;
    s.y += s.vy;
    if (s.y >= groundY) {
      for (let i = 0; i < 3; i++) {
        state.puffs.push({
          x: s.x,
          y: groundY,
          vy: -1,
          img: (state.assets.getImg("explosionImgs") as HTMLImageElement[])[i],
          age: 0,
          maxAge: 30,
          size: 64,
        });
      }
      state.audio.play?.("artilleryExplode");
      return false;
    }
    return true;
  });

  // Napalm missile update and tile drops
  state.napalmMissiles = state.napalmMissiles.filter((n) => {
    n.x += n.vx;
    n.life--;
    if (--n.dropTimer <= 0 && n.dropsRemaining > 0) {
      n.dropsRemaining--;
      n.dropTimer = NAPALM_DROP_INTERVAL;
      state.napalmTiles.push({
        x: n.x,
        y: n.y,
        life: 60,
        maxLife: 60,
        vy: 0,
        killsPlayer: false,
      });
      state.audio.play?.("napalmDrop");
    }
    return n.life > 0;
  });

  // Napalm tile update, player collision (crash or shield)
  state.napalmTiles = state.napalmTiles.filter((t) => {
    t.life--;
    if (
      t.x >= PLANE_OFFSET_X &&
      t.x <= PLANE_OFFSET_X + PLANE_WIDTH &&
      t.y >= state.y &&
      t.y <= state.y + PLANE_HEIGHT
    ) {
      if (state.activePowerups.shield.expires > state.frameCount) {
        state.shieldFlash = 10;
        state.activePowerups.shield.expires = 0;
        state.audio.play?.("shield");
      } else {
        state.crashed = true;
        state.audio.play?.("crash");
      }
    }
    return t.life > 0;
  });

  // Plane propeller animation
  state.planeFrameCounter++;
  if (
    state.planeFrameCounter >= 6 &&
    (state.assets.getImg("planeFrames") as HTMLImageElement[]).length > 0
  ) {
    state.planeFrameCounter = 0;
    state.planeFrame =
      (state.planeFrame + 1) %
      (state.assets.getImg("planeFrames") as HTMLImageElement[]).length;
  }

  // Advance global frame count
  state.frameCount++;
}

export function drawSystems(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  const { width, height } = state.dims;
  const groundY = height - 50;
  const tileW =
    (state.assets.getImg("groundImgs") as HTMLImageElement[])[state.groundIndex]
      ?.width || 256;

  // SKY
  ctx.fillStyle = SKY_COLOR;
  ctx.fillRect(0, 0, width, height);

  // GROUND
  for (let x = -state.groundOffset; x < width; x += tileW) {
    ctx.drawImage(
      (state.assets.getImg("groundImgs") as HTMLImageElement[])[
        state.groundIndex
      ],
      x,
      groundY,
      tileW,
      50
    );
  }

  // MOUNTAINS
  state.mountains.forEach((m) => {
    ctx.globalAlpha = 0.8;
    ctx.drawImage(m.img, m.x, m.y, m.width, m.height);
  });

  // TREES
  state.trees.forEach((t) => {
    ctx.globalAlpha = 0.9;
    ctx.drawImage(t.img, t.x, t.y, t.width, t.height);
  });

  // CLOUDS
  ctx.globalAlpha = 1;
  state.clouds.forEach((c) => {
    c.puffs.forEach(({ img, dx, dy, scale }) => {
      ctx.globalAlpha = 0.8;
      ctx.drawImage(
        img,
        c.x + dx,
        c.y + dy,
        img.width * scale,
        img.height * scale
      );
    });
  });
  ctx.globalAlpha = 1;

  // AIRSHIPS
  state.airships.forEach((a) => {
    const bob = Math.sin(a.bobOffset) * AIRSHIP_BOB_AMPLITUDE;
    const img = a.frames[a.frameIndex];
    ctx.drawImage(img, a.x, a.baseY + bob);
  });

  // PLANE
  if (!state.crashed) {
    ctx.save();
    const cx = PLANE_OFFSET_X + PLANE_WIDTH / 2;
    const cy = state.y + PLANE_HEIGHT / 2;
    ctx.translate(cx, cy);
    if (state.activePowerups.ghost.expires > state.frameCount) {
      ctx.globalAlpha = 0.4;
    }
    ctx.rotate(state.planeAngle);
    ctx.drawImage(
      (state.assets.getImg("planeFrames") as HTMLImageElement[])[
        state.planeFrame
      ],
      -PLANE_WIDTH / 2,
      -PLANE_HEIGHT / 2,
      PLANE_WIDTH,
      PLANE_HEIGHT
    );
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ENEMIES
  const enemyScale =
    state.activePowerups.shrink.expires > state.frameCount ? 0.4 : 1;
  state.enemies.forEach((e) => {
    if (!e.alive) return;
    const w = ENEMY_WIDTH * enemyScale;
    const h = ENEMY_HEIGHT * enemyScale;
    ctx.save();
    ctx.translate(e.x + ENEMY_WIDTH / 2, e.y + ENEMY_HEIGHT / 2);
    ctx.rotate(e.rotation || 0);
    ctx.drawImage(e.frames[e.propFrame], -w / 2, -h / 2, w, h);
    ctx.restore();

    if (e.hasStick) {
      ctx.globalAlpha = 1 - e.targetFadeAge / e.targetFadeMax;
      ctx.drawImage(
        e.targetImg!,
        e.x + ENEMY_WIDTH / 2 - e.targetImg!.width / 2,
        e.y + ENEMY_HEIGHT - e.targetImg!.height,
        e.targetImg!.width,
        e.targetImg!.height
      );
      ctx.globalAlpha = 1;
    }
  });

  // WATER
  state.waters.forEach((w) => {
    for (let i = 0; i < w.size; i++) {
      const img = (state.assets.getImg("waterImgs") as HTMLImageElement[])[
        i % (state.assets.getImg("waterImgs") as HTMLImageElement[]).length
      ];
      ctx.drawImage(
        img,
        w.x + i * (img.width * 0.5),
        w.y,
        img.width * 0.5,
        img.height * 0.5
      );
    }
  });

  // DUCKS
  state.ducks.forEach((d) => {
    const w =
      state.activePowerups.ducksight.expires > state.frameCount
        ? d.width * 1.5
        : d.width;
    const h =
      state.activePowerups.ducksight.expires > state.frameCount
        ? d.height * 1.5
        : d.height;
    const x = d.x - (w - d.width) / 2,
      y = d.y - (h - d.height) / 2;
    ctx.save();
    if (d.dir < 0) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(d.hit ? d.outlineImg : d.img, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(d.hit ? d.outlineImg : d.img, x, y, w, h);
    }
    ctx.restore();
  });

  // PROJECTILES & EFFECTS

  // Cannonballs
  state.cannonballs.forEach((cb) => {
    ctx.drawImage(cb.img, cb.x, cb.y, 16, 16);
  });

  // Homing Missiles
  state.homingMissiles.forEach((m) => {
    const ang = Math.atan2(m.vy, m.vx);
    const tf = (state.assets.getImg("fireImgs") as HTMLImageElement[])[
      m.tailFrame %
        (state.assets.getImg("fireImgs") as HTMLImageElement[]).length
    ];
    const bx = m.x - Math.cos(ang) * (tf.width / 2);
    const by = m.y - Math.sin(ang) * (tf.height / 2);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(ang + Math.PI);
    ctx.drawImage(tf, -tf.width / 2, -tf.height / 2, tf.width, tf.height);
    ctx.restore();
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(ang);
    ctx.drawImage(
      m.img,
      -tf.width / 4,
      -tf.height / 4,
      tf.width / 2,
      tf.height / 2
    );
    ctx.restore();
  });

  // Artillery Shells
  state.artilleryShells.forEach((s) => {
    const ang = Math.atan2(s.vy, s.vx);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(ang);
    ctx.drawImage(
      s.img,
      -ARTILLERY_SHELL_SIZE / 2,
      -ARTILLERY_SHELL_SIZE / 2,
      ARTILLERY_SHELL_SIZE,
      ARTILLERY_SHELL_SIZE
    );
    ctx.restore();
  });

  // Napalm Missiles
  state.napalmMissiles.forEach((n) => {
    ctx.drawImage(n.img, n.x, n.y, NAPALM_MISSILE_SIZE, NAPALM_MISSILE_SIZE);
  });

  // Napalm Tiles (flames)
  state.napalmTiles.forEach((t) => {
    const age = t.maxLife - t.life;
    const idx =
      Math.floor(
        (age / t.maxLife) *
          (state.assets.getImg("flameImgs") as HTMLImageElement[]).length
      ) % (state.assets.getImg("flameImgs") as HTMLImageElement[]).length;
    const f = (state.assets.getImg("flameImgs") as HTMLImageElement[])[idx];
    ctx.globalAlpha = t.life / t.maxLife;
    ctx.drawImage(
      f,
      t.x - NAPALM_MISSILE_SIZE / 2,
      t.y - NAPALM_MISSILE_SIZE / 2,
      NAPALM_MISSILE_SIZE,
      NAPALM_MISSILE_SIZE
    );
    ctx.globalAlpha = 1;
  });

  // Puffs (explosions, etc)
  state.puffs.forEach((p) =>
    ctx.drawImage(p.img, p.x, p.y, p.size ?? 32, p.size ?? 32)
  );

  // Sparks
  state.sparkEffects.forEach((s) => {
    const img = (state.assets.getImg("sparkImgs") as HTMLImageElement[])[
      s.frameIndex
    ];
    ctx.globalAlpha = 1 - s.age / s.maxAge;
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(img, s.x, s.y, 32, 64);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  });

  // Bullet holes
  state.bulletHoles.forEach((h) => {
    ctx.globalAlpha = 1 - h.age / h.maxAge;
    ctx.drawImage(
      state.assets.getImg("bulletHoleImg") as HTMLImageElement,
      h.x - 8,
      h.y - 8,
      16,
      16
    );
    ctx.globalAlpha = 1;
  });

  // Floating scores
  state.floatingScores.forEach((f) => {
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(`${f.amount}`, f.x, f.y);
  });

  // Falling
  state.falling.forEach((f) => {
    ctx.save();
    ctx.translate(f.x + ENEMY_WIDTH / 2, f.y + ENEMY_HEIGHT / 2);
    ctx.scale(-1, 1);
    ctx.drawImage(
      f.img,
      -ENEMY_WIDTH / 2,
      -ENEMY_HEIGHT / 2,
      ENEMY_WIDTH,
      ENEMY_HEIGHT
    );
    ctx.restore();
  });

  // No UI overlay here!
}

/**
 * Called every frame to update game simulation before render
 * - Spawns new entities, then updates all state/physics/collisions.
 */
export function updateFrame(state: GameState) {
  spawnSystems(state);
  updateSystems(state);
}

/**
 * Called every frame to draw the entire game
 * - Passes the canvas context and full state.
 */
export function renderFrame(ctx: CanvasRenderingContext2D, state: GameState) {
  drawSystems(ctx, state);
}
