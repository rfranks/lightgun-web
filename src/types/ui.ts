/**
 * An object with all asset refs as .current properties, for robust asset lookup.
 * Example: get("planeFrames") returns the ref for the yellow plane image.
 */
export interface AssetMgr {
  get: (
    key: string
  ) =>
    | HTMLImageElement
    | HTMLImageElement[]
    | HTMLImageElement[][]
    | Record<string, HTMLImageElement>
    | Record<string, HTMLImageElement[]>
    | undefined;
  getImg: (
    key: string
  ) =>
    | HTMLImageElement
    | HTMLImageElement[]
    | HTMLImageElement[][]
    | Record<string, HTMLImageElement>
    | Record<string, HTMLImageElement[]>
    | undefined;
  assetRefs: Record<
    string,
    | undefined
    | HTMLImageElement
    | HTMLImageElement[]
    | HTMLImageElement[][]
    | Record<string, HTMLImageElement>
    | Record<string, HTMLImageElement[]>
  >;
}

/**
 * Dimensions for the game UI.
 */
export interface Dims {
  /** Width of the game canvas */
  width: number;
  /** Height of the game canvas */
  height: number;
}

/**
 * Floating label for scores, streaks, or other feedback.
 */
export interface TextLabel {
  text: string;
  /** Display scale (font/asset scaling) */
  scale: number;
  /** If true, position is fixed (not moving with camera/world) */
  fixed: boolean;
  /** If true, label fades out when age reaches maxAge */
  fade: boolean;
  /** X position (pixels) */
  x: number;
  /** Y position (pixels) */
  y: number;
  /** Current age in frames */
  age: number;
  /** Maximum age before removal */
  maxAge: number;
}

/**
 * Main game phase/state for UI and logic. The initial asset loading phase has
 * been removed, so the game starts in the "ready" state.
 */
export type Phase = "ready" | "go" | "playing" | "title";

/**
 * Alias for Phase, for rendering-specific state.
 */
export type RenderPhase = Phase;
