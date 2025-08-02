import React, { useRef } from "react";

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(null);
  const runningRef = useRef(true);

  // useEffect(() => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;
  //   canvas.width = window.innerWidth;
  //   canvas.height = window.innerHeight;
  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;

  //   const best = Number(localStorage.getItem("bestAccuracy") || 0);
  //   const assetMgr = { getImg } as AssetMgr;
  //   const lbl = newTextLabel(
  //     {
  //       text: `${best}%`,
  //       scale: 1,
  //       fixed: true,
  //       fade: false,
  //       x: 16,
  //       y: 16,
  //     },
  //     assetMgr
  //   );
  //   const pctImg = getImg("pctImg") as HTMLImageElement;
  //   const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
  //   const digits = best.toString().split("").map((ch) => digitImgs[ch]);
  //   lbl.imgs = [...digits, pctImg];

  //   const fishImgs = getImg("fishImgs") as Record<string, HTMLImageElement>;
  //   const fishKinds = Object.keys(fishImgs);
  //   const FISH_SIZE = 128;

  //   interface DemoFish {
  //     x: number;
  //     y: number;
  //     vx: number;
  //     vy: number;
  //     angle: number;
  //     img: HTMLImageElement;
  //   }

  //   const spawnFish = (): DemoFish => {
  //     const edge = Math.floor(Math.random() * 4);
  //     const speed =
  //       Math.random() * (FISH_SPEED_MAX - FISH_SPEED_MIN) + FISH_SPEED_MIN;
  //     const cross = (Math.random() - 0.5) * speed;
  //     let x = 0;
  //     let y = 0;
  //     let vx = 0;
  //     let vy = 0;
  //     switch (edge) {
  //       case 0:
  //         x = -FISH_SIZE;
  //         y = Math.random() * (canvas.height - FISH_SIZE);
  //         vx = speed;
  //         vy = cross;
  //         break;
  //       case 1:
  //         x = canvas.width + FISH_SIZE;
  //         y = Math.random() * (canvas.height - FISH_SIZE);
  //         vx = -speed;
  //         vy = cross;
  //         break;
  //       case 2:
  //         x = Math.random() * (canvas.width - FISH_SIZE);
  //         y = -FISH_SIZE;
  //         vx = cross;
  //         vy = speed;
  //         break;
  //       default:
  //         x = Math.random() * (canvas.width - FISH_SIZE);
  //         y = canvas.height + FISH_SIZE;
  //         vx = cross;
  //         vy = -speed;
  //         break;
  //     }
  //     const kind =
  //       fishKinds[Math.floor(Math.random() * fishKinds.length)];
  //     const img = fishImgs[kind];
  //     return { x, y, vx, vy, angle: Math.atan2(vy, vx), img };
  //   };

  //   const fish: DemoFish[] = Array.from({ length: 5 }, spawnFish);
  //   let labels = [lbl];

  //   const loop = () => {
  //     if (!runningRef.current) return;

  //     ctx.clearRect(0, 0, canvas.width, canvas.height);

  //     fish.forEach((f, idx) => {
  //       f.x += f.vx;
  //       f.y += f.vy;
  //       if (
  //         f.x < -FISH_SIZE ||
  //         f.x > canvas.width + FISH_SIZE ||
  //         f.y < -FISH_SIZE ||
  //         f.y > canvas.height + FISH_SIZE
  //       ) {
  //         fish[idx] = spawnFish();
  //       }
  //       f.angle = Math.atan2(f.vy, f.vx);
  //       ctx.save();
  //       ctx.translate(f.x + FISH_SIZE / 2, f.y + FISH_SIZE / 2);
  //       ctx.rotate(f.angle);
  //       ctx.drawImage(f.img, -FISH_SIZE / 2, -FISH_SIZE / 2, FISH_SIZE, FISH_SIZE);
  //       ctx.restore();
  //     });

  //     labels = drawTextLabels({ textLabels: labels, ctx });

  //     animRef.current = requestAnimationFrame(loop);
  //   };

  //   animRef.current = requestAnimationFrame(loop);

  //   return () => {
  //     runningRef.current = false;
  //     if (animRef.current) cancelAnimationFrame(animRef.current);
  //   };
  // }, [getImg]);

  const handleStart = () => {
    runningRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    onStart();
  };

  return (
    <Box
      position="relative"
      width="100vw"
      height="100dvh"
      sx={{ backgroundColor, cursor }}
      display="flex"
      justifyContent="center"
      alignItems="center"
      onClick={handleStart}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <Box
        component="img"
        src={titleSrc}
        alt="Zombiefish"
        sx={{ width: "auto", height: "100%", cursor }}
      />
    </Box>
  );
};
