import { describe, it, expect, vi } from "vitest";
import {
  IDENTITY_STROKE_TRANSFORM,
  MAX_FIT_SCALE,
  getFitTransform,
  renderStrokes,
} from "../../src/lib/canvasRender";
import type { StrokeData } from "../../src/store/gameState";

const stroke = (
  x: number,
  y: number,
  isNewStroke = false,
  color = "#000000",
): StrokeData => ({ x, y, color, isNewStroke });

const makeCtx = (width = 200, height = 100) =>
  ({
    canvas: { width, height },
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    lineCap: "",
    lineJoin: "",
    lineWidth: 0,
    strokeStyle: "",
  }) as unknown as CanvasRenderingContext2D;

describe("renderStrokes", () => {
  it("clears the canvas and paints a dot for the first point of a stroke", () => {
    const ctx = makeCtx();

    renderStrokes(ctx, [stroke(10, 20, true)]);

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 200, 100);
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 20);
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 20);
  });

  it("continues a line from the previous point", () => {
    const ctx = makeCtx();

    renderStrokes(ctx, [stroke(10, 10, true), stroke(30, 40)]);

    expect(ctx.moveTo).toHaveBeenLastCalledWith(10, 10);
    expect(ctx.lineTo).toHaveBeenLastCalledWith(30, 40);
  });

  it("applies the transform to every point and to the line width", () => {
    const ctx = makeCtx();

    renderStrokes(ctx, [stroke(10, 10, true)], {
      scale: 0.5,
      offsetX: 5,
      offsetY: 2,
    });

    expect(ctx.moveTo).toHaveBeenCalledWith(10, 7);
    expect(ctx.lineWidth).toBe(2);
  });
});

describe("getFitTransform", () => {
  it("returns the identity transform when there is nothing to fit", () => {
    expect(getFitTransform([], 200, 100)).toEqual(IDENTITY_STROKE_TRANSFORM);
    expect(getFitTransform([stroke(0, 0, true)], 0, 0)).toEqual(
      IDENTITY_STROKE_TRANSFORM,
    );
  });

  it("scales the bounding box down to fit and centers it", () => {
    const strokes = [stroke(0, 0, true), stroke(200, 100)];

    const { scale, offsetX, offsetY } = getFitTransform(strokes, 100, 100);

    // Width is the limiting axis: 100 / 200
    expect(scale).toBeCloseTo(0.5);
    expect(offsetX).toBeCloseTo(0);
    // 100px tall box, 50px of scaled content => 25px of letterboxing
    expect(offsetY).toBeCloseTo(25);
  });

  it("honours the padding and re-centers content drawn off-origin", () => {
    const strokes = [stroke(100, 100, true), stroke(200, 200)];

    const { scale, offsetX, offsetY } = getFitTransform(strokes, 100, 100, 10);

    // (100 - 2 * 10) / 100
    expect(scale).toBeCloseTo(0.8);
    // The bounding box starts at 100, so it is shifted back into the box
    expect(offsetX).toBeCloseTo(-70);
    expect(offsetY).toBeCloseTo(-70);
  });

  it("caps the zoom so a single dot does not explode", () => {
    const { scale } = getFitTransform([stroke(50, 50, true)], 500, 500);

    expect(scale).toBe(MAX_FIT_SCALE);
  });
});
