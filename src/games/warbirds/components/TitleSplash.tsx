import React from "react";

import Box from "@mui/material/Box";

export interface TitleSplashProps {
  onStart: () => void;
  titleSrc: string;
  backgroundColor: string;
  cursor: string;
}

export const TitleSplash: React.FC<TitleSplashProps> = ({
  onStart,
  titleSrc,
  backgroundColor,
  cursor,
}) => (
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
    <Box
      component="img"
      src={titleSrc}
      alt="Warbirds"
      sx={{ width: "auto", height: "100%", cursor }}
    />
  </Box>
);
