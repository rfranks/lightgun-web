"use client";
import { useEffect, useRef, useCallback, useState } from "react";

export function useGameAssets() {
  const [ready, setReady] = useState(false);
  const assets = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = (src: string) => {
      const img = new window.Image();
      img.src = src;
      return img;
    };
    assets.current.shipImg = load(
      "/assets/pirates/PNG/Retina/Ships/ship (1).png"
    );
    assets.current.bulletImg = load(
      "/assets/tanks/PNG/Retina/tank_bullet5.png"
    );
    setReady(true);
  }, []);

  const getImg = useCallback(
    (key: string) => assets.current[key],
    []
  );

  return { ready, getImg };
}
