import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import useStraightCashAssets from "../hooks/useStraightCashAssets";

export interface ReelProps {
  spinning: boolean;
  locked: boolean;
  onStop: () => void;
}

const ITEM_SIZE = 120;

export const Reel: React.FC<ReelProps> = ({ spinning, locked, onStop }) => {
  const { assetRefs, ready } = useStraightCashAssets();

  const items = useMemo(() => {
    if (!ready) return [] as (HTMLImageElement | null)[];
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
    const keys = suits.flatMap((s) => ranks.map((r) => `${s}${r}`));
    keys.push("Joker");

    return [
      null, // blank slot
      ...keys.map((k) => cardImgs[k]),
      wheelImg,
    ] as (HTMLImageElement | null)[];
  }, [ready, assetRefs]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!spinning || items.length === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 100);
    return () => clearInterval(id);
  }, [spinning, items.length]);

  const handleClick = () => {
    if (!locked) {
      onStop();
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
        {items.map((img, i) => (
          <Box
            key={i}
            component={img ? "img" : "div"}
            src={img ? img.src : undefined}
            width={ITEM_SIZE}
            height={ITEM_SIZE}
            sx={{ display: "block" }}
          />
        ))}
        {items.length > 0 && (
          <Box
            component={items[0] ? "img" : "div"}
            src={items[0] ? items[0]!.src : undefined}
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
