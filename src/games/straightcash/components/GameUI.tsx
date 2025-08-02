import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { ClickEvent } from "@/types/events";
import Reel from "./Reel";
import BonusWheel from "./BonusWheel";
import JackpotDisplay, { JackpotHandle } from "./JackpotDisplay";
import { withBasePath } from "@/utils/basePath";

export interface GameUIProps {
  cursor: string;
  onShot: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleClick: (e: ClickEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
  startSpins: (amount: number, denom: number) => void;
  spinning: boolean[];
  locked: boolean[];
  showDie: boolean[];
  handleReelClick: (index: number, e: React.MouseEvent<HTMLDivElement>) => void;
  onSpinEnd: (index: number, result: string) => void;
  forcedResults: (string | null)[];
  wheelSpinning: boolean;
  onWheelFinish: (reward: string) => void;
  wheelReady: boolean;
  onWheelStart: () => void;
  bet: number;
  jackpotRef: React.RefObject<JackpotHandle | null>;
  tokenValue: number;
  setTokenValue: React.Dispatch<React.SetStateAction<number>>;
  tokens: number;
}

export default function GameUI({
  cursor,
  onShot,
  canvasRef,
  handleClick,
  handleContext,
  startSpins,
  spinning,
  locked,
  showDie,
  handleReelClick,
  onSpinEnd,
  forcedResults,
  wheelSpinning,
  onWheelFinish,
  wheelReady,
  onWheelStart,
  bet,
  jackpotRef,
  tokenValue,
  setTokenValue,
  tokens,
}: GameUIProps) {
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
    <Box
      position="relative"
      width="100vw"
      height="100dvh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      onClickCapture={onShot}
    >
      <JackpotDisplay bet={bet} ref={jackpotRef} />
      <Typography variant="h6" color="white" sx={{ mb: 1 }}>
        Tokens: {tokens}
      </Typography>
      <Box position="relative">
        <BonusWheel spinning={wheelSpinning} onFinish={onWheelFinish} />
        {wheelReady && !wheelSpinning && (
          <Box
            component="img"
            src={withBasePath("/assets/shooting-gallery/PNG/HUD/text_spin.svg")}
            alt="Spin"
            onClick={onWheelStart}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 150,
              height: "auto",
              cursor,
            }}
          />
        )}
      </Box>
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
            stopResult={forcedResults[i] ?? undefined}
            cursor={cursor}
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
            <ToggleButton key={val} value={val} sx={{ cursor }}>
              {val === 0.25 ? "25¢" : `$${val}`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box display="flex" gap={1}>
        {[1, 5, 10].map((n) => (
          <Button
            key={n}
            variant="contained"
            onClick={() => handleBet(n)}
            sx={{ cursor }}
          >
            {n} Token{n > 1 ? "s" : ""}
          </Button>
        ))}
      </Box>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContext}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleClick({
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "block",
          width: "100%",
          height: "100%",
          cursor,
        }}
      />
    </Box>
  );
}
