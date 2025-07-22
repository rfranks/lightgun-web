// src/hooks/useWindowSize.ts
import { useState, useEffect } from "react";

import type { Dims } from "@/types/ui";

/**
 * Tracks window.innerWidth / window.innerHeight
 * Returns { width, height } as a Dims object.
 */
export function useWindowSize(): Dims {
  // Initialize to zero so SSR doesn't break
  const [windowSize, setWindowSize] = useState<Dims>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}
