import { useEffect, useRef } from "react";
import { withBasePath } from "@/utils/basePath";

/**
 * Custom React hook to load an audio file with a fallback to MP3.
 * If the initial audio source fails, and it is not an MP3, tries to load the .mp3 variant.
 * Logs a warning if both attempts fail.
 */
export const useAudio = (url: string, loop = false) => {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let a: HTMLAudioElement | null = new Audio();
    let triedFallback = false;

    function tryLoadAudio(audioUrl: string) {
      if (!a) return;
      const ext = audioUrl.split(".").pop() || "";
      const mime = ext === "mp3" ? "audio/mpeg" : `audio/${ext}`;

      // Check if browser supports this audio type
      if (a.canPlayType(mime) === "") {
        if (ext.toLowerCase() !== "mp3" && !triedFallback) {
          triedFallback = true;
          const mp3Url = audioUrl.replace(/\.[^/.]+$/, ".mp3");
          tryLoadAudio(mp3Url);
        } else {
          console.warn(`Skipping audio load, unsupported type: ${mime}`);
        }
        return;
      }

      a.src = withBasePath(audioUrl);
      a.loop = loop;
      a.load();
    }

    function handleError() {
      if (triedFallback) {
        console.warn("Failed to load Audio (all formats):", url);
        return;
      }
      // Try fallback to .mp3 if not already mp3
      const ext = url.split(".").pop() || "";
      if (ext.toLowerCase() !== "mp3") {
        triedFallback = true;
        const mp3Url = url.replace(/\.[^/.]+$/, ".mp3");
        tryLoadAudio(mp3Url);
      } else {
        console.warn("Failed to load Audio:", url);
      }
    }

    a.addEventListener("error", handleError);

    try {
      tryLoadAudio(url);
    } catch (e) {
      console.warn("Failed to create/load Audio:", url, e);
    }

    ref.current = a;

    return () => {
      a?.removeEventListener("error", handleError);
      a = null;
    };
    // Note: Only re-run if url or loop changes
  }, [url, loop]);

  return ref;
};
