// src/app/main/page.tsx
"use client";

import React from "react";
import { Container } from "@mui/material";
import Game from "@/games/pirates";

export default function Home() {
  return (
    <Container
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Game />
    </Container>
  );
}
