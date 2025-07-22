"use client";
import React from "react";
import Box from "@mui/material/Box";
import { MAX_AMMO, DEFAULT_CURSOR } from "../constants";

export interface GameUIProps {
  score: number;
  ammo: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  handleClick: (e: React.MouseEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
  getImg: (key: string) => HTMLImageElement | undefined;
  cursor: string;
}

export default function GameUI({
  score,
  ammo,
  canvasRef,
  handleClick,
  handleContext,
  getImg,
  cursor,
}: GameUIProps) {
  const bulletSrc = getImg("bulletImg")?.src;
  return (
    <Box position="relative" width="100vw" height="100vh">
      <Box position="absolute" top={16} left={16} display="flex" zIndex={1}>
        {Array.from({ length: MAX_AMMO }).map((_, i) => (
          <Box
            key={i}
            component="img"
            src={bulletSrc}
            width={32}
            height={32}
            sx={{ mr: 0.5, opacity: i < ammo ? 1 : 0.3, rotate: "-90deg" }}
          />
        ))}
      </Box>
      <Box
        position="absolute"
        top={16}
        right={16}
        zIndex={1}
        sx={{ fontSize: 32, color: "white", fontWeight: "bold", cursor: DEFAULT_CURSOR }}
      >
        Score: {score}
      </Box>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContext}
        style={{ width: "100%", height: "100%", cursor }}
      />
    </Box>
  );
}
