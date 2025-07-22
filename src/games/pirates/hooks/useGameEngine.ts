"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useGameAssets } from "./useGameAssets";
import { useGameAudio } from "./useGameAudio";
import {
  MAX_AMMO,
  SKY_COLOR,
  DEFAULT_CURSOR,
  SHOT_CURSOR,
} from "../constants";

export function useGameEngine() {
  const dims = useWindowSize();
  const { ready, getImg } = useGameAssets();
  const audio = useGameAudio();

  const [phase, setPhase] = useState<"title" | "playing">("title");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [ammo, setAmmo] = useState(MAX_AMMO);
  const [cursor, setCursor] = useState(DEFAULT_CURSOR);
  const ship = useRef({ x: 0, y: 0, speed: 2, w: 0, h: 0 });

  const spawnShip = useCallback(() => {
    const img = getImg("shipImg") as HTMLImageElement | undefined;
    if (!img) return;
    ship.current.w = img.width;
    ship.current.h = img.height;
    ship.current.x = dims.width;
    ship.current.y = Math.random() * (dims.height - img.height);
    ship.current.speed = 2 + Math.random() * 2;
  }, [dims.width, dims.height, getImg]);

  useEffect(() => {
    if (!ready || phase !== "playing") return;
    spawnShip();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    let frame: number;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      ctx.fillStyle = SKY_COLOR;
      ctx.fillRect(0, 0, dims.width, dims.height);
      ship.current.x -= ship.current.speed;
      if (ship.current.x + ship.current.w < 0) spawnShip();
      const img = getImg("shipImg") as HTMLImageElement | undefined;
      if (img) ctx.drawImage(img, ship.current.x, ship.current.y);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [ready, phase, dims.width, dims.height, spawnShip, getImg]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (phase !== "playing" || ammo <= 0) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setAmmo((a) => a - 1);
      setCursor(SHOT_CURSOR);
      setTimeout(() => setCursor(DEFAULT_CURSOR), 100);
      audio.play("shot");
      if (
        x >= ship.current.x &&
        x <= ship.current.x + ship.current.w &&
        y >= ship.current.y &&
        y <= ship.current.y + ship.current.h
      ) {
        setScore((s) => s + 100);
        audio.play("hit");
        spawnShip();
      }
    },
    [phase, ammo, audio, spawnShip]
  );

  const handleContext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (phase !== "playing") return;
      if (ammo < MAX_AMMO) {
        setAmmo(MAX_AMMO);
        audio.play("reload");
      }
    },
    [phase, ammo, audio]
  );

  const startGame = useCallback(() => {
    setScore(0);
    setAmmo(MAX_AMMO);
    setPhase("playing");
  }, []);

  return {
    phase,
    startGame,
    canvasRef,
    handleClick,
    handleContext,
    ammo,
    score,
    getImg,
    cursor,
  };
}
