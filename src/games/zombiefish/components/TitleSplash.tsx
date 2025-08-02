import React, { useEffect, useRef } from "react";

import Box from "@mui/material/Box";
import { drawTextLabels, newTextLabel } from "@/utils/ui";
import type { AssetMgr } from "@/types/ui";

export interface TitleSplashProps {
  onStart: () => void;
  titleSrc: string;
  backgroundColor: string;
  cursor: string;
  getImg: AssetMgr["getImg"];
}

export const TitleSplash: React.FC<TitleSplashProps> = ({
  onStart,
  titleSrc,
  backgroundColor,
  cursor,
  getImg,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const best = Number(localStorage.bestAccuracy || 0);
    const assetMgr = { getImg } as AssetMgr;
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
    drawTextLabels({ textLabels: [lbl], ctx });
  }, [getImg]);

  return (
    <Box
      position="relative"
      width="100vw"
      height="100dvh"
      sx={{ backgroundColor, cursor }}
      display="flex"
      justifyContent="center"
      alignItems="center"
      onClick={onStart}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <Box
        component="img"
        src={titleSrc}
        alt="Zombiefish"
        sx={{ width: "auto", height: "100%", cursor }}
      />
    </Box>
  );
};
