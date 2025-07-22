"use client";
import React from "react";
import Box from "@mui/material/Box";
import { SKY_COLOR, DEFAULT_CURSOR } from "../constants";

export interface TitleSplashProps {
  onStart: () => void;
}

export default function TitleSplash({ onStart }: TitleSplashProps) {
  return (
    <Box
      onClick={onStart}
      position="relative"
      width="100vw"
      height="100vh"
      sx={{ backgroundColor: SKY_COLOR, cursor: DEFAULT_CURSOR }}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Box
        component="img"
        src="/assets/pirates/PNG/Retina/Ships/ship (1).png"
        alt="Pirate Ship"
        sx={{ width: 300, height: "auto" }}
      />
      <Box sx={{ mt: 2, fontSize: 48, color: "white", fontWeight: "bold" }}>
        Pirate Shooter
      </Box>
      <Box sx={{ mt: 1, fontSize: 24, color: "white" }}>Click to start</Box>
    </Box>
  );
}
