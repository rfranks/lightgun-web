import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { SKY_COLOR } from "../constants";

export interface ScoreSplashProps {
  reward: string | number | null;
  onReset: () => void;
  autoReturnMs?: number;
}

export default function ScoreSplash({ reward, onReset, autoReturnMs = 3000 }: ScoreSplashProps) {
  useEffect(() => {
    const id = window.setTimeout(onReset, autoReturnMs);
    return () => window.clearTimeout(id);
  }, [onReset, autoReturnMs]);

  return (
    <Box
      position="relative"
      width="100vw"
      height="100dvh"
      sx={{ backgroundColor: SKY_COLOR }}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      onClick={onReset}
    >
      <Typography variant="h3" color="white" sx={{ mb: 2 }}>
        {reward != null ? `Reward: ${reward}` : ""}
      </Typography>
      <Button variant="contained" onClick={onReset}>
        Reset
      </Button>
    </Box>
  );
}
