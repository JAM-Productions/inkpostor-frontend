import { describe, it, expect } from "vitest";
import { getStrokeBounds, getFitTransform } from "../../src/lib/strokeGeometry";
import type { StrokeData } from "../../src/store/gameState";

const point = (x: number, y: number): StrokeData => ({
  x,
  y,
  color: "#000",
  isNewStroke: false,
});

describe("getStrokeBounds", () => {
  it("measures the box the drawing occupies", () => {
    expect(
      getStrokeBounds([point(10, 20), point(50, 5), point(30, 40)]),
    ).toEqual({ minX: 10, minY: 5, maxX: 50, maxY: 40 });
  });

  it("has no box for an empty canvas", () => {
    expect(getStrokeBounds([])).toBeNull();
  });
});

describe("getFitTransform", () => {
  it("scales to whichever axis runs out first, keeping the proportions", () => {
    // 100x100 of drawing into a 200x400 box: the width is what limits it.
    const { scale } = getFitTransform(
      { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      200,
      400,
    );

    expect(scale).toBe(2);
  });

  it("centres what is left over on the roomier axis", () => {
    const { scale, offsetX, offsetY } = getFitTransform(
      { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      200,
      400,
    );

    // Filled across, so nothing to share out there.
    expect(offsetX).toBe(0);
    // 400 tall against 200 of drawing leaves 200 to split above and below.
    expect(offsetY).toBe(100);
    expect(100 * scale + offsetY).toBe(300);
  });

  it("brings a drawing back to the origin of its own box", () => {
    // Points carry the coordinates of the canvas they were drawn on, which may
    // start a long way from where the preview does.
    const { offsetX, offsetY } = getFitTransform(
      { minX: 400, minY: 400, maxX: 500, maxY: 500 },
      100,
      100,
    );

    expect(400 + offsetX).toBe(0);
    expect(400 + offsetY).toBe(0);
  });

  it("keeps the padding clear on every side", () => {
    const { scale, offsetX } = getFitTransform(
      { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      140,
      140,
      20,
    );

    expect(offsetX).toBe(20);
    expect(100 * scale + offsetX).toBe(120);
  });

  it("does not blow a dot up to fill the box", () => {
    // A single point spans nothing, so nothing can be scaled to fit.
    const { scale } = getFitTransform(
      { minX: 50, minY: 50, maxX: 50, maxY: 50 },
      400,
      400,
    );

    expect(scale).toBe(1);
  });

  it("lets the other axis decide the scale for a straight line", () => {
    const { scale } = getFitTransform(
      { minX: 10, minY: 0, maxX: 10, maxY: 100 },
      400,
      200,
    );

    expect(scale).toBe(2);
  });

  it("caps how far a small drawing is enlarged", () => {
    const { scale } = getFitTransform(
      { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      1000,
      1000,
    );

    expect(scale).toBe(3);
  });

  it("falls back to an identity for an empty canvas", () => {
    expect(getFitTransform(null, 200, 200, 8)).toEqual({
      scale: 1,
      offsetX: 8,
      offsetY: 8,
    });
  });
});
