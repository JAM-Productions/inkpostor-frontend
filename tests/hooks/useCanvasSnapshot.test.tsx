import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCanvasSnapshot } from "../../src/hooks/useCanvasSnapshot";
import type { StrokeData } from "../../src/store/gameState";

/**
 * The still preview. Its whole job is to be there already, so what is worth
 * pinning is that it paints once, in full, without waiting for a frame.
 */
describe("useCanvasSnapshot", () => {
  let ctx: any;
  let alphas: number[];

  const point = (x: number): StrokeData => ({
    x,
    y: x,
    color: "#000",
    isNewStroke: x === 0,
  });

  const Harness: React.FC<{ strokes: StrokeData[] }> = ({ strokes }) => {
    const { canvasRef, containerRef } = useCanvasSnapshot(strokes);
    return (
      <div ref={containerRef}>
        <canvas ref={canvasRef} />
      </div>
    );
  };

  beforeEach(() => {
    alphas = [];
    ctx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      lineCap: "",
      lineJoin: "",
      lineWidth: 0,
      strokeStyle: "",
      set globalAlpha(value: number) {
        alphas.push(value);
      },
      get globalAlpha() {
        return 1;
      },
    };

    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 200,
    });
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as any;
    // Nothing here may need one, which is the point of the test.
    vi.stubGlobal("requestAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
    Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
  });

  it("paints the whole drawing on render, asking for no frames", () => {
    const strokes = [point(0), point(1), point(2)];

    render(<Harness strokes={strokes} />);

    expect(ctx.lineTo).toHaveBeenCalledTimes(strokes.length);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(alphas.every((alpha) => alpha === 1)).toBe(true);
  });

  it("fits the drawing into its box, as the replay does", () => {
    // 0..100 into 300x200 less 16 of padding: the height limits it at 168/100,
    // and what is left over across is split either side.
    render(<Harness strokes={[point(0), point(100)]} />);

    expect(ctx.lineTo).toHaveBeenCalledWith(66, 16);
    expect(ctx.lineTo).toHaveBeenCalledWith(234, 184);
  });

  it("repaints from scratch when the drawing changes", () => {
    const { rerender } = render(<Harness strokes={[point(0), point(1)]} />);
    ctx.clearRect.mockClear();
    ctx.lineTo.mockClear();

    rerender(<Harness strokes={[point(0), point(1), point(2)]} />);

    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalledTimes(3);
  });

  it("draws nothing at all for an untouched canvas", () => {
    render(<Harness strokes={[]} />);

    expect(ctx.lineTo).not.toHaveBeenCalled();
  });
});
