import { useEffect, useRef } from "react";

export const useAudio = (url: string, loop = false) => {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let a: HTMLAudioElement;
    try {
      a = new Audio();
      // pick MIME from extension
      const ext = url.split(".").pop() || "";
      const mime = ext === "mp3" ? "audio/mpeg" : `audio/${ext}`;
      // bail out if unsupported
      if (a.canPlayType(mime) === "") {
        console.warn(`Skipping audio load, unsupported type: ${mime}`);
        return;
      }
      a.src = url;
      a.loop = loop;
      a.load();
    } catch (e) {
      console.warn("Failed to create/load Audio:", url, e);
      return;
    }
    ref.current = a;
  }, [url, loop]);
  return ref;
};
