import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  useMemo,
} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export interface JackpotDisplayProps {
  bet: number;
}

export interface JackpotHandle {
  /**
   * Award the specified jackpot, returning the payout amount and
   * resetting the jackpot back to its base value.
   */
  awardJackpot: (type: "minor" | "major" | "grand") => number;
}

interface JackpotValues {
  minor: number;
  major: number;
  grand: number;
}

function randomInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function baseValues(bet: number): JackpotValues {
  const base = Math.max(0, bet - 10);
  return {
    minor: base * 100,
    major: base * 1000,
    grand: base * 10000,
  };
}

export default forwardRef<JackpotHandle, JackpotDisplayProps>(function JackpotDisplay(
  { bet }: JackpotDisplayProps,
  ref,
) {
  const base = useMemo(() => baseValues(bet), [bet]);
  const [values, setValues] = useState<JackpotValues>(() => base);
  const valuesRef = useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    setValues(base);
  }, [base]);

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

  useImperativeHandle(
    ref,
    () => ({
      awardJackpot(type) {
        const payout = valuesRef.current[type];
        setValues((v) => ({ ...v, [type]: base[type] }));
        return payout;
      },
    }),
    [base],
  );

  return (
    <Box display="flex" gap={2} mb={1}>
      <Typography color="gold">Minor: {values.minor}</Typography>
      <Typography color="goldenrod">Major: {values.major}</Typography>
      <Typography color="orange">Grand: {values.grand}</Typography>
    </Box>
  );
});
