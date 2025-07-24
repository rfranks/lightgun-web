import React, { useEffect, useMemo, useState, useRef } from "react";
import Box from "@mui/material/Box";
import useStraightCashAssets from "../hooks/useStraightCashAssets";

export interface ReelProps {
  spinning: boolean;
  locked: boolean;
  onStop: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSpinEnd?: (result: string) => void;
}

const ITEM_SIZE = 120;

export const Reel: React.FC<ReelProps> = ({
  spinning,
  locked,
  onStop,
  onSpinEnd,
}) => {
  const { assetRefs, ready } = useStraightCashAssets();

  const items = useMemo(() => {
    if (!ready) return [] as { img: HTMLImageElement | null; rank: string }[];
    const cardImgs = assetRefs.cardImgs as Record<string, HTMLImageElement>;
    const wheelImg = assetRefs.wheelBonusChipImg as HTMLImageElement;

    const suits = ["Clubs", "Diamonds", "Hearts", "Spades"];
    const ranks = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];

    const arr: { img: HTMLImageElement | null; rank: string }[] = [
      { img: null, rank: "blank" },
    ];
    for (const suit of suits) {
      for (const r of ranks) {
        arr.push({ img: cardImgs[`${suit}${r}`], rank: r });
      }
    }
    arr.push({ img: wheelImg, rank: "wheel" });

    return arr;
  }, [ready, assetRefs]);

  const [index, setIndex] = useState(0);
  const prevSpinning = useRef(spinning);

  useEffect(() => {
    if (!spinning || items.length === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 100);
    return () => clearInterval(id);
  }, [spinning, items.length]);

  useEffect(() => {
    if (prevSpinning.current && !spinning && onSpinEnd) {
      onSpinEnd(items[index]?.rank ?? "blank");
    }
    prevSpinning.current = spinning;
  }, [spinning, index, onSpinEnd, items]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!locked) {
      onStop(e);
    }
  };

  return (
    <Box
      width={ITEM_SIZE}
      height={ITEM_SIZE}
      overflow="hidden"
      position="relative"
      onClick={handleClick}
      sx={{ cursor: locked ? "default" : "pointer" }}
    >
      <Box
        position="absolute"
        sx={{ transform: `translateY(${-index * ITEM_SIZE}px)` }}
      >
        {items.map((item, i) => (
          <Box
            key={i}
            component={item.img ? "img" : "div"}
            src={item.img ? item.img.src : undefined}
            width={ITEM_SIZE}
            height={ITEM_SIZE}
            sx={{ display: "block" }}
          />
        ))}
        {items.length > 0 && (
          <Box
            component={items[0].img ? "img" : "div"}
            src={items[0].img ? items[0].img!.src : undefined}
            width={ITEM_SIZE}
            height={ITEM_SIZE}
            sx={{ display: "block" }}
          />
        )}
      </Box>
      {locked && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(0,0,0,0.3)"
        />
      )}
    </Box>
  );
};

export default Reel;
