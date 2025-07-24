import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Reel from "./Reel";
import BonusWheel from "./BonusWheel";
import JackpotDisplay from "./JackpotDisplay";

export interface GameUIProps {
  cursor: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleClick: (e: React.MouseEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
  startSpins: (amount: number, denom: number) => void;
  spinning: boolean[];
  locked: boolean[];
  showDie: boolean[];
  handleReelClick: (index: number, e: React.MouseEvent<HTMLDivElement>) => void;
  onSpinEnd: (index: number, result: string) => void;
  wheelSpinning: boolean;
  onWheelFinish: (reward: string) => void;
  bet: number;
}

export default function GameUI({
  cursor,
  canvasRef,
  handleClick,
  handleContext,
  startSpins,
  spinning,
  locked,
  showDie,
  handleReelClick,
  onSpinEnd,
  wheelSpinning,
  onWheelFinish,
  bet,
}: GameUIProps) {
  const [tokenValue, setTokenValue] = useState<number>(1);

  const handleBet = (amount: number) => {
    startSpins(amount, tokenValue);
  };

  const tokenOptions = [0.25, 1, 5, 10, 50];

  const isReelDisabled = (index: number) => {
    if (bet < 5) return index > 0;
    if (bet < 10) return index > 1;
    return false;
  };

  return (
    <Box position="relative" width="100vw" height="100dvh" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      <JackpotDisplay bet={bet} />
      <BonusWheel spinning={wheelSpinning} onFinish={onWheelFinish} />
      <Box display="flex" gap={2} mb={2}>
        {spinning.map((spin, i) => (
          <Reel
            key={i}
            spinning={spin}
            locked={locked[i]}
            disabled={isReelDisabled(i)}
            showDie={showDie[i]}
            onStop={(e) => handleReelClick(i, e)}
            onSpinEnd={(result) => onSpinEnd(i, result)}
          />
        ))}
      </Box>
      <Box mb={2}>
        <ToggleButtonGroup
          exclusive
          value={tokenValue}
          onChange={(_, val) => {
            if (val !== null) setTokenValue(val);
          }}
          size="small"
        >
          {tokenOptions.map((val) => (
            <ToggleButton key={val} value={val}>
              {val === 0.25 ? "25¢" : `$${val}`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box display="flex" gap={1}>
        {[1, 5, 10].map((n) => (
          <Button key={n} variant="contained" onClick={() => handleBet(n)}>
            {n} Token{n > 1 ? "s" : ""}
          </Button>
        ))}
      </Box>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContext}
        style={{
          display: "none",
          width: "100%",
          height: "100%",
          cursor,
        }}
      />
    </Box>
  );
}
