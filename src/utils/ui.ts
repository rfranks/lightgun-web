import { AssetMgr, Dims, TextLabel } from "@/types/ui";

/**
 * Draws an array of text labels on the given canvas context.
 * @param textLabels - The text labels to draw.
 * @param ctx - The canvas rendering context to draw on.
 * @param offsetX - Optional horizontal offset for the labels.
 * @param offsetY - Optional vertical offset for the labels.
 * @param cull - If true, removes labels that have reached their max age.
 * @returns The array of drawn text labels.
 */
export function drawTextLabels({
  textLabels,
  ctx,
  offsetX,
  offsetY,
  cull,
}: {
  textLabels: TextLabel[];
  ctx: CanvasRenderingContext2D;
  offsetX?: number;
  offsetY?: number;
  cull?: boolean;
}): TextLabel[] {
  // get current alpha
  const prevAlpha = ctx.globalAlpha;

  textLabels.forEach((lbl) => {
    // adjust alpha for fade effect, if applicable
    const alpha = lbl.fade ? 1 - lbl.age / lbl.maxAge : 1;
    ctx.globalAlpha = alpha;

    // set the starting x position
    const drawX = lbl.fixed ? lbl.x : lbl.x - (offsetX || 0);

    // track the x position for each image
    let dx = drawX;

    // draw each image in the label, accounting for scale and spacing
    for (const img of lbl.imgs) {
      if (img) {
        // calculate width and height based on scale
        const w = img.width * lbl.scale;
        const h = img.height * lbl.scale;

        // draw the image at the calculated position
        ctx.drawImage(img, dx, lbl.y - (offsetY || 0), w, h);

        // increment x position for the next image
        dx += w + 2;
      } else {
        // if the image is null (for space), just increment by space gap
        // this maintains the spacing for text
        dx += lbl.spaceGap;
      }
    }

    // increment age for the label
    lbl.age++;
  });

  // reset alpha to previous value
  ctx.globalAlpha = prevAlpha;

  if (cull) {
    // if cull, remove expired labels
    textLabels = textLabels.filter((l) => l.age < l.maxAge);
  }

  return textLabels;
}

/**
 * Creates a new text label.
 * @param textLabelProps - The properties for the text label.
 * @param assetMgr - The asset manager to use for loading images.
 * @param dims - The dimensions of the area where the label will be drawn.
 * @returns The new text label, with associated imgs, age and position.
 */
export function newTextLabel(
  textLabelProps: Omit<
    TextLabel,
    "age" | "imgs" | "x" | "y" | "maxAge" | "spaceGap"
  > & {
    x?: number;
    y?: number;
    maxAge?: number;
    spaceGap?: number;
  },
  assetMgr: AssetMgr,
  dims?: Dims
): TextLabel {
  // destructure properties from textLabelProps
  const { text, scale, fixed, fade, x, y, maxAge } = textLabelProps;
  let { spaceGap } = textLabelProps;

  // get images from asset manager
  const { getImg } = assetMgr;
  if (!getImg) {
    throw new Error("Asset manager does not have getImg method");
  }

  // use letterImgs, numberImgs, or digitImgs based on character type
  const letterImgs = getImg("letterImgs") as Record<string, HTMLImageElement>;
  const numberImgs = getImg("numberImgs") as Record<string, HTMLImageElement>;
  const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;

  // measure total width, accounting for spaces
  let totalWidth = 0;

  // give spaces a width roughly matching a letter
  // (this is a bit arbitrary, but should be close enough for most cases)
  spaceGap = spaceGap || letterImgs["A"].width * 1.5 * scale;

  const imgs: (HTMLImageElement | null)[] = [];

  Array.from(text).forEach((ch) => {
    if (ch === " ") {
      totalWidth += spaceGap;
      imgs.push(null); // push null for space to maintain index
    } else {
      const img =
        letterImgs[ch.toUpperCase()] || numberImgs[ch] || digitImgs[ch];
      if (img) {
        totalWidth += img.width * scale + 2;
        imgs.push(img);
      }
    }
  });
  const posX =
    x ?? (dims?.width !== undefined ? (dims.width - totalWidth) / 2 : 0);
  const posY = y ?? (dims?.height !== undefined ? dims.height * 0.2 : 0);

  const newLabel: TextLabel = {
    text,
    imgs,
    scale,
    fixed,
    fade,
    x: posX,
    y: posY,
    age: 0,
    maxAge: maxAge ? maxAge : fade ? 60 : Infinity,
    spaceGap,
  };

  return newLabel;
}
