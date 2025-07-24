import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";

export interface BonusWheelProps {
  spinning: boolean;
  onFinish: (reward: string) => void;
}

const REWARDS = [
  "20",
  "25",
  "30",
  "50",
  "100",
  "250",
  "500",
  "Minor",
  "Major",
  "Grand",
];

const COLORS = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#009688",
  "#4caf50",
  "#ff9800",
  "#795548",
];

export default function BonusWheel({ spinning, onFinish }: BonusWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const radius = canvas.width / 2;
    const wedgeAngle = (2 * Math.PI) / REWARDS.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < REWARDS.length; i++) {
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(
        radius,
        radius,
        radius,
        i * wedgeAngle - Math.PI / 2,
        (i + 1) * wedgeAngle - Math.PI / 2
      );
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(i * wedgeAngle + wedgeAngle / 2 - Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.fillText(REWARDS[i], radius * 0.6, 5);
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    if (!spinning) return;
    const wedgeSize = 360 / REWARDS.length;
    const spins = Math.floor(Math.random() * 3) + 3; // 3-5 full spins
    const target = Math.floor(Math.random() * REWARDS.length);
    const finalAngle = spins * 360 + target * wedgeSize + wedgeSize / 2;
    const duration = 4000;
    setRotation(finalAngle);
    const nudge = Math.random() * 10 - 5;
    const id = setTimeout(() => {
      setRotation((r) => r + nudge);
      setTimeout(() => onFinish(REWARDS[target]), 500);
    }, duration);
    return () => clearTimeout(id);
  }, [spinning, onFinish]);

  return (
    <Box
      position="relative"
      width={300}
      height={300}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        component="canvas"
        ref={canvasRef}
        width={300}
        height={300}
        sx={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4s ease-out" : undefined }}
      />
      <Box
        position="absolute"
        top={0}
        left="50%"
        sx={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: "20px solid #000", transform: "translateX(-50%)" }}
      />
    </Box>
  );
}
