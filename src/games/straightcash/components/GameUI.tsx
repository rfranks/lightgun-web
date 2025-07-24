import React from "react";
import Box from "@mui/material/Box";

export interface GameUIProps {
  cursor: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleClick: (e: React.MouseEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
}

export default function GameUI({
  cursor,
  canvasRef,
  handleClick,
  handleContext,
}: GameUIProps) {
  return (
    <Box position="relative" width="100vw" height="100dvh">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContext}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor,
        }}
      />
    </Box>
  );
}
