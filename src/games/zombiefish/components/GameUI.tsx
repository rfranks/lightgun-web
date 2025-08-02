import React from "react";
import Box from "@mui/material/Box";
import { GameUIState } from "../types";

export interface GameUIProps {
  ui: GameUIState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleClick: (e: React.MouseEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
  getImg: (
    key: string
  ) =>
    | HTMLImageElement
    | HTMLImageElement[]
    | HTMLImageElement[][]
    | Record<string, HTMLImageElement>
    | Record<string, HTMLImageElement[]>
    | undefined;
}

// Minimal in-game UI showing timer, shots and hits
export function GameUI({
  ui,
  canvasRef,
  handleClick,
  handleContext,
}: GameUIProps) {
  const { timer, shots, hits, cursor } = ui;

  return (
    <Box position="relative" width="100vw" height="100dvh">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContext}
        style={{ display: "block", width: "100%", height: "100%", cursor }}
      />

      {/* Heads-up display */}
      <Box
        position="absolute"
        top={16}
        left={16}
        sx={{ color: "white", fontSize: 24 }}
      >
        <div>Time: {timer}</div>
        <div>Shots: {shots}</div>
        <div>Hits: {hits}</div>
      </Box>

    </Box>
  );
}

export default GameUI;
