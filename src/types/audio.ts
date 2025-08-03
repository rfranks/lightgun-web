/**
 * Audio manager passed into the engine for playing & stopping sounds.
 */
export interface AudioMgr
  extends Record<
    string,
    | (() => void)
    | ((key: string) => void)
    | ((key: string, options?: { loop?: boolean; volume?: number }) => void)
    | ((keys: string[], options?: { loop?: boolean; volume?: number }) => void)
  > {
  /**
   * Play a sound by key.
   * @param key     Identifier matching your loaded audio asset.
   * @param options Optional looping/volume controls.
   */
  play: (key: string, options?: { loop?: boolean; volume?: number }) => void;

  /**
   * Play a sequence of sounds by key.
   * @param keys    Ordered list of identifiers matching loaded audio assets.
   * @param options Optional looping/volume controls applied to each sound.
   */
  playSequence: (
    keys: string[],
    options?: { loop?: boolean; volume?: number }
  ) => void;

  /**
   * Pause a sound by key.
   * @param key Identifier matching your loaded audio asset.
   */
  pause: (key: string) => void;

  /**
   * Immediately pause all currently playing sounds.
   */
  pauseAll: () => void;
}
