import React from "react";
import Box from "@mui/material/Box";

export interface TitleSplashProps {
  onStart: () => void;
  titleSrc: string;
  backgroundColor: string;
  cursor: string;
  onShot: () => void;
}

export const TitleSplash: React.FC<TitleSplashProps> = ({
  onStart,
  titleSrc,
  backgroundColor,
  cursor,
  onShot,
}) => (
  <Box
    position="relative"
    width="100vw"
    height="100dvh"
    sx={{ backgroundColor, cursor }}
    display="flex"
    justifyContent="center"
    alignItems="center"
    onClick={() => {
      onShot();
      onStart();
    }}
  >
    <Box
      component="img"
      src={titleSrc}
      alt="Straight Cash"
      sx={{ width: "auto", height: "100%", cursor }}
    />
  </Box>
);

export default TitleSplash;
