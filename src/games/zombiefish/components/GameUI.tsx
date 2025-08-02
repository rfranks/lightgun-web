import React from "react";
import Box from "@mui/material/Box";

export interface GameUIProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Current cursor style to display over the canvas */
  cursor: string;
  handleClick: (e: React.MouseEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
}

// Minimal in-game UI
export function GameUI({
  canvasRef,
  cursor,
  handleClick,
  handleContext,
}: GameUIProps) {

  return (
    <Box position="relative" width="100vw" height="100dvh">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContext}
        style={{ display: "block", width: "100%", height: "100%", cursor }}
      />
    </Box>
  );
}

export default GameUI;
