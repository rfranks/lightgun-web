import React from "react";
import Box from "@mui/material/Box";
import {
  SCORE_DIGIT_PATH,
  SCORE_DIGIT_WIDTH,
  SCORE_DIGIT_HEIGHT,
} from "@/constants/ui";
import { SKY_COLOR } from "../constants";

/**
 * Props for ReadyGoSplash.
 */
export interface ReadyGoSplashProps {
  /** "ready" or "go" */
  phase: "ready" | "go";
  /** Current countdown digit (only for "ready" phase) */
  countdown: number | null;
}

/**
 * Renders the "Ready" or "Go" splash screen with countdown.
 */
export const ReadyGoSplash: React.FC<ReadyGoSplashProps> = ({
  phase,
  countdown,
}) => {
  const src =
    phase === "ready"
      ? "/assets/shooting-gallery/PNG/HUD/text_ready.png"
      : "/assets/shooting-gallery/PNG/HUD/text_go.png";

  return (
    <Box
      position="relative"
      width="100vw"
      height="100vh"
      sx={{ backgroundColor: SKY_COLOR }}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Box
        component="img"
        src={src}
        alt={phase}
        sx={{ width: 300, height: "auto" }}
      />
      {phase === "ready" && countdown != null && (
        <Box
          component="img"
          src={`${SCORE_DIGIT_PATH}${countdown}.png`}
          alt={`${countdown}`}
          sx={{
            mt: 2,
            width: SCORE_DIGIT_WIDTH * 5,
            height: SCORE_DIGIT_HEIGHT * 5,
            // fade-up animation
            animation: "fadeUp 1s ease-out forwards",
          }}
        />
      )}
    </Box>
  );
};

export default ReadyGoSplash;
