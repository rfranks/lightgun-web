import React from "react";
import Box from "@mui/material/Box";
import { GameUIState } from "../types";

export interface GameUIProps {
  ui: GameUIState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleClick: (e: React.MouseEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
  resetGame: () => void;
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
  resetGame,
}: GameUIProps) {
  const { phase, timer, shots, hits } = ui;

  return (
    <Box position="relative" width="100vw" height="100dvh">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContext}
        style={{ display: "block", width: "100%", height: "100%" }}
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

      {/* Game over overlay */}
      {phase === "gameover" && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          sx={{
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: 48,
            cursor: "pointer",
          }}
          onClick={resetGame}
        >
          Game Over
        </Box>
      )}
    </Box>
  );
}

export default GameUI;
