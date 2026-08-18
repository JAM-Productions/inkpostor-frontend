import type { StrokeData } from "../store/gameState";
import type { FitTransform } from "./strokeGeometry";

/** Line width the canvas was drawn with, before it is scaled to a preview. */
const SOURCE_LINE_WIDTH = 4;
const MIN_LINE_WIDTH = 1.5;

/** How much of the box a preview keeps clear around the drawing. */
export const STROKE_PADDING = 16;

/** The brush, scaled to the preview but never thinner than it can be seen. */
export const getPreviewLineWidth = (scale: number): number =>
  Math.max(MIN_LINE_WIDTH, SOURCE_LINE_WIDTH * scale);

/**
 * Paints `points[from, to)` onto a canvas at one opacity.
 *
 * A range that opens mid-line is joined to the point before it, so any stretch
 * of a drawing can be painted on its own and still come out continuous.
 *
 * Points that carry on the same line in the same colour go down as one path.
 * Stroking them one segment at a time is what makes a faded line come out
 * stippled: the round caps of neighbouring segments overlap, and at anything
 * under full opacity every join composites twice and shows as a dot.
 */
export const paintStrokes = (
  ctx: CanvasRenderingContext2D,
  points: StrokeData[],
  from: number,
  to: number,
  alpha: number,
  transform: FitTransform,
): void => {
  if (to <= from) return;
  const { scale, offsetX, offsetY } = transform;
  const projectX = (x: number) => x * scale + offsetX;
  const projectY = (y: number) => y * scale + offsetY;

  ctx.globalAlpha = alpha;
  let pen = from > 0 && !points[from].isNewStroke ? points[from - 1] : null;
  let openPath = false;
  let pathColor = "";

  for (let i = from; i < to; i++) {
    const stroke = points[i];
    const previous = stroke.isNewStroke ? null : pen;

    if (!openPath || stroke.color !== pathColor || !previous) {
      if (openPath) ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      pathColor = stroke.color;
      openPath = true;
      ctx.moveTo(
        projectX(previous ? previous.x : stroke.x),
        projectY(previous ? previous.y : stroke.y),
      );
    }

    ctx.lineTo(projectX(stroke.x), projectY(stroke.y));
    pen = stroke;
  }
  if (openPath) ctx.stroke();
  ctx.globalAlpha = 1;
};
