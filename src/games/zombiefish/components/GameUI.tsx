import React from "react";
import Box from "@mui/material/Box";
import { withBasePath } from "@/utils/basePath";
import type { GameUIState } from "../types";

export interface GameUIProps {
  ui: GameUIState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Current cursor style to display over the canvas */
  cursor: string;
  handleClick: (e: React.MouseEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
}

// Minimal in-game UI
export function GameUI({
  ui,
  canvasRef,
  cursor,
  handleClick,
  handleContext,
  handleMouseMove,
}: GameUIProps) {
  const { phase, cursor } = ui;

  return (
    <Box position="relative" width="100vw" height="100dvh">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContext}
        onMouseMove={handleMouseMove}
        style={{ display: "block", width: "100%", height: "100%", cursor }}
      />
      {phase === "gameover" && (
        <Box
          component="img"
          src={withBasePath(
            "/assets/shooting-gallery/PNG/HUD/text_gameover.png"
          )}
          alt="Game Over"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 300,
            height: "auto",
            pointerEvents: "none",
          }}
        />
      )}
    </Box>
  );
}

export default GameUI;
