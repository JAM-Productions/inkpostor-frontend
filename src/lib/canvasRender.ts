import type { StrokeData } from "../store/gameState";

/** Line width used when strokes are painted at their original scale. */
export const STROKE_WIDTH = 4;

/** Upper bound for the zoom applied when fitting strokes into a preview. */
export const MAX_FIT_SCALE = 3;

export interface StrokeTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const IDENTITY_STROKE_TRANSFORM: StrokeTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

/**
 * Clears the canvas and repaints every stroke, applying `transform` to each
 * point so the same stroke list can be rendered both at full size (the drawing
 * surface) and scaled down (the preview).
 */
export const renderStrokes = (
  ctx: CanvasRenderingContext2D,
  strokes: StrokeData[],
  transform: StrokeTransform = IDENTITY_STROKE_TRANSFORM,
) => {
  const { scale, offsetX, offsetY } = transform;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(STROKE_WIDTH * scale, 1);

  let previousPoint: { x: number; y: number } | null = null;

  strokes.forEach((stroke) => {
    const x = stroke.x * scale + offsetX;
    const y = stroke.y * scale + offsetY;
    // A new stroke (or the very first point) is painted as a dot so single
    // taps stay visible; the rest continue the line from the previous point.
    const from =
      stroke.isNewStroke || !previousPoint ? { x, y } : previousPoint;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    previousPoint = { x, y };
  });
};

/**
 * Builds the transform that fits the bounding box of `strokes` inside a
 * `width` x `height` box, keeping the aspect ratio and centering the result.
 *
 * Fitting the drawn content (instead of the original canvas rect) keeps the
 * preview readable no matter the size of the device the strokes came from,
 * which matters because stroke coordinates are stored in the drawer's own
 * canvas pixel space.
 */
export const getFitTransform = (
  strokes: StrokeData[],
  width: number,
  height: number,
  padding = 0,
): StrokeTransform => {
  if (strokes.length === 0 || width <= 0 || height <= 0) {
    return IDENTITY_STROKE_TRANSFORM;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    if (stroke.x < minX) minX = stroke.x;
    if (stroke.x > maxX) maxX = stroke.x;
    if (stroke.y < minY) minY = stroke.y;
    if (stroke.y > maxY) maxY = stroke.y;
  }

  const contentWidth = Math.max(maxX - minX, 1);
  const contentHeight = Math.max(maxY - minY, 1);
  const availableWidth = Math.max(width - padding * 2, 1);
  const availableHeight = Math.max(height - padding * 2, 1);

  const scale = Math.min(
    availableWidth / contentWidth,
    availableHeight / contentHeight,
    MAX_FIT_SCALE,
  );

  return {
    scale,
    offsetX: (width - contentWidth * scale) / 2 - minX * scale,
    offsetY: (height - contentHeight * scale) / 2 - minY * scale,
  };
};
