import type { StrokeData } from "../store/gameState";

export interface StrokeBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Where a point of the drawing lands in the box it is being replayed into. */
export interface FitTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** How far a drawing may be blown up, so a two-point dot stays a dot. */
const MAX_ZOOM = 3;

export const getStrokeBounds = (strokes: StrokeData[]): StrokeBounds | null => {
  if (strokes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const { x, y } of strokes) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { minX, minY, maxX, maxY };
};

/**
 * Fits a drawing into a box of a different size.
 *
 * Points are stored in the pixels of the canvas they were drawn on, which is
 * whatever size that player's screen gave it — never the size of the box the
 * preview gets. Rather than assume a source size nobody recorded, the drawing is
 * measured and scaled to fill what it has, keeping its proportions and centred
 * on whatever room is left over.
 */
export const getFitTransform = (
  bounds: StrokeBounds | null,
  width: number,
  height: number,
  padding = 0,
): FitTransform => {
  const availableWidth = Math.max(0, width - padding * 2);
  const availableHeight = Math.max(0, height - padding * 2);
  if (!bounds) return { scale: 1, offsetX: padding, offsetY: padding };

  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;

  // A drawing with no width is a vertical line, and vice versa: it is the other
  // axis that has to decide the scale. With no width and no height there is a
  // single point, which any scale draws identically.
  const scaleX = spanX > 0 ? availableWidth / spanX : Infinity;
  const scaleY = spanY > 0 ? availableHeight / spanY : Infinity;
  const fitted = Math.min(scaleX, scaleY);
  const scale = Number.isFinite(fitted) ? Math.min(fitted, MAX_ZOOM) : 1;

  return {
    scale,
    offsetX:
      padding + (availableWidth - spanX * scale) / 2 - bounds.minX * scale,
    offsetY:
      padding + (availableHeight - spanY * scale) / 2 - bounds.minY * scale,
  };
};
