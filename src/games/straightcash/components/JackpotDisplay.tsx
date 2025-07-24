import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export interface JackpotDisplayProps {
  bet: number;
}

interface JackpotValues {
  minor: number;
  major: number;
  grand: number;
}

function randomInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function JackpotDisplay({ bet }: JackpotDisplayProps) {
  const [values, setValues] = useState<JackpotValues>(() => ({
    minor: randomInRange(bet * 50, bet * 100),
    major: randomInRange(bet * 100, bet * 200),
    grand: randomInRange(bet * 200, bet * 400),
  }));

  useEffect(() => {
    setValues({
      minor: randomInRange(bet * 50, bet * 100),
      major: randomInRange(bet * 100, bet * 200),
      grand: randomInRange(bet * 200, bet * 400),
    });
  }, [bet]);

  useEffect(() => {
    const id = setInterval(() => {
      setValues((v) => ({
        minor: v.minor + randomInRange(1, 3),
        major: v.major + randomInRange(2, 5),
        grand: v.grand + randomInRange(5, 10),
      }));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <Box display="flex" gap={2} mb={1}>
      <Typography color="gold">Minor: {values.minor}</Typography>
      <Typography color="goldenrod">Major: {values.major}</Typography>
      <Typography color="orange">Grand: {values.grand}</Typography>
    </Box>
  );
}
