import React from "react";
import Box from "@mui/material/Box";
import { PowerupType } from "@/types/objects";
import {
  SCORE_LABEL_SRC,
  SCORE_DIGIT_PATH,
  SCORE_DIGIT_WIDTH,
  SCORE_DIGIT_HEIGHT,
} from "@/constants/ui";
import { ENEMY_COLORS } from "@/constants/vehicles";
import { MAX_AMMO, DEFAULT_CURSOR } from "../constants";
import { withBasePath } from "@/utils/basePath";
import { GameUIState } from "../types";

/**
 * Props for GameUI component.
 */
export interface GameUIProps {
  ui: GameUIState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleClick: (e: React.MouseEvent) => void;
  handleContext: (e: React.MouseEvent) => void;
  resetGame: () => void;
  getImg: (
    key: string
  ) =>
    | HTMLImageElement
    | HTMLImageElement[]
    | HTMLImageElement[][]
    | Record<string, HTMLImageElement>
    | Record<string, HTMLImageElement[]>
    | undefined;
}

/**
 * Renders the main in-game UI overlay: ammo, medals, ducks, enemies, score, powerups, and game-over.
 */
export function GameUI({
  ui,
  canvasRef,
  handleClick,
  handleContext,
  resetGame,
  getImg,
}: GameUIProps) {
  const {
    ammo,
    medalCount,
    duckCount,
    enemyCount,
    score,
    crashed,
    frameCount,
    activePowerups,
    cursor,
  } = ui;

  const medalFrames = getImg("medalFrames") as HTMLImageElement[][];

  return (
    <Box position="relative" width="100vw" height="100dvh">
      {/* Ammo icons */}
      <Box
        position="absolute"
        top={16}
        left={16}
        display="flex"
        zIndex={1}
        onClick={handleContext}
      >
        {Array.from({ length: MAX_AMMO }).map((_, i) => (
          <Box
            key={i}
            component="img"
            src={
              i < ammo
                ? withBasePath("/assets/tanks/PNG/Retina/tank_bullet5.png")
                : withBasePath("/assets/tanks/PNG/Retina/tank_bullet1.png")
            }
            width={64}
            height={64}
            sx={{ mr: 1.5, rotate: "-90deg", cursor: DEFAULT_CURSOR }}
          />
        ))}
      </Box>
      {/* Medal counter */}
      {medalCount > 0 && (
        <Box
          position="absolute"
          top={16 + 32 + 8}
          left={16}
          display="flex"
          alignItems="center"
          zIndex={1}
          sx={{ cursor: DEFAULT_CURSOR }}
        >
          <Box
            component="img"
            src={
              medalFrames[0]?.[0]?.src ||
              withBasePath("/assets/medals/PNG/flat_medal1.png")
            }
            width={48}
            height={48}
            sx={{ mr: 2 }}
          />
          <Box
            component="span"
            sx={{ fontSize: 48, color: "white", fontWeight: "bold" }}
          >
            x{medalCount}
          </Box>
        </Box>
      )}

      {/* Duck counter */}
      {duckCount > 0 && (
        <Box
          position="absolute"
          top={16 + 32 + 8 + (48 + 8)}
          left={16}
          display="flex"
          alignItems="center"
          zIndex={1}
          sx={{ cursor: DEFAULT_CURSOR }}
        >
          <Box
            component="img"
            src={withBasePath(
              "/assets/shooting-gallery/PNG/Objects/duck_brown.png"
            )}
            width={48}
            height={48}
            sx={{ mr: 2 }}
          />
          <Box sx={{ fontSize: 48, color: "white", fontWeight: "bold" }}>
            x{duckCount}
          </Box>
        </Box>
      )}

      {/* Enemy-plane counter */}
      {enemyCount > 0 && (
        <Box
          position="absolute"
          top={16 + 32 + 8 + 2 * (48 + 8)}
          left={16}
          display="flex"
          alignItems="center"
          zIndex={1}
          sx={{ cursor: DEFAULT_CURSOR }}
        >
          <Box
            component="img"
            src={withBasePath(ENEMY_COLORS[0])}
            width={48}
            height={48}
            sx={{ mr: 2 }}
          />
          <Box sx={{ fontSize: 48, color: "white", fontWeight: "bold" }}>
            x{enemyCount}
          </Box>
        </Box>
      )}
      {/* Score display */}
      <Box
        position="absolute"
        top={16}
        right={16}
        display="flex"
        alignItems="center"
        zIndex={1}
      >
        <Box
          component="img"
          src={withBasePath(SCORE_LABEL_SRC)}
          alt="Score"
          sx={{ mr: 1 }}
        />
        {String(score)
          .split("")
          .map((d, i) => (
            <Box
              key={i}
              component="img"
              src={withBasePath(`${SCORE_DIGIT_PATH}${d}.png`)}
              alt={d}
              width={SCORE_DIGIT_WIDTH}
              height={SCORE_DIGIT_HEIGHT}
              sx={{ mr: 0.5 }}
            />
          ))}
      </Box>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContext}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor,
        }}
      />
      {/* Game Over overlay */}
      {crashed && (
        <Box
          component="img"
          src={withBasePath(
            "/assets/shooting-gallery/PNG/HUD/text_gameover.png"
          )}
          alt="Game Over"
          onClick={resetGame}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 450,
            height: "auto",
            cursor: DEFAULT_CURSOR,
          }}
        />
      )}
      {/* Active Powerups */}
      {!crashed && (
        <Box
          position="absolute"
          bottom={16}
          right={16}
          display="flex"
          gap={1}
          zIndex={2}
        >
          {(Object.keys(activePowerups) as PowerupType[])
            .filter((t) => activePowerups[t].expires > frameCount)
            .map((t) => {
              const timeLeft = activePowerups[t].expires - frameCount;
              const flash = timeLeft < 60 && timeLeft % 10 < 5;
              const powerupImgs = getImg("powerupImgs") as Record<
                string,
                HTMLImageElement
              >;
              const imgSrc = powerupImgs[t].src;

              return (
                <Box
                  key={t}
                  component="img"
                  src={imgSrc}
                  width={64}
                  height={64}
                  sx={{ opacity: flash ? 0.3 : 1 }}
                />
              );
            })}
        </Box>
      )}
    </Box>
  );
}

export default GameUI;
