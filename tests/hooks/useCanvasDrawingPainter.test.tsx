import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCanvasDrawing } from "../../src/hooks/useCanvasDrawing";
import { useGameStore, type StrokeData } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

/**
 * Guards the painting strategy itself, not just the pixels it ends up with.
 *
 * Replaying every stroke on every incoming point is what made a long turn cost
 * quadratic time, so "appending a point did not clear the canvas" is the
 * property worth pinning: a refactor that quietly goes back to a full redraw
 * still draws the right picture, and only this test would notice.
 */
describe("useCanvasDrawing painting", () => {
  let ctx: {
    clearRect: ReturnType<typeof vi.fn>;
    beginPath: ReturnType<typeof vi.fn>;
    moveTo: ReturnType<typeof vi.fn>;
    lineTo: ReturnType<typeof vi.fn>;
    stroke: ReturnType<typeof vi.fn>;
    lineCap: string;
    lineJoin: string;
    lineWidth: number;
    strokeStyle: string;
  };

  let storeState: any;

  const stroke = (x: number, isNewStroke = false): StrokeData => ({
    x,
    y: x,
    color: "#ffffff",
    isNewStroke,
  });

  const mockStateBase = {
    myId: "socket-123",
    hostId: "socket-host",
    players: [{ id: "socket-host" }, { id: "socket-123" }],
    currentTurnPlayerId: "socket-123",
    canvasStrokes: [] as StrokeData[],
    gameOptions: { unlimitedInk: false, playerColorsEnabled: false },
    actions: { drawStroke: vi.fn(), undoStroke: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
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
    };
    storeState = { ...mockStateBase };
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(storeState),
    );
  });

  // The hook paints nothing until its canvas ref is attached, and the ref only
  // exists once the hook has rendered. So it starts empty, the stand-in canvas
  // is wired up, and the opening strokes are delivered as the first update.
  const renderWithCanvas = (canvasStrokes: StrokeData[]) => {
    storeState = { ...mockStateBase, canvasStrokes: [] };
    const hook = renderHook(() => useCanvasDrawing());

    const canvas = document.createElement("canvas");
    canvas.getContext = vi.fn(() => ctx) as any;
    hook.result.current.canvasRef.current = canvas;

    const setStrokes = (next: StrokeData[]) => {
      storeState = { ...storeState, canvasStrokes: next };
      hook.rerender();
    };

    setStrokes([...canvasStrokes]);
    return { setStrokes };
  };

  it("only draws the points that arrived, without clearing", () => {
    const first = [stroke(0, true), stroke(1)];
    const { setStrokes } = renderWithCanvas(first);

    expect(ctx.stroke).toHaveBeenCalledTimes(2);
    ctx.stroke.mockClear();
    ctx.clearRect.mockClear();

    // Two more points arrive on the same array.
    setStrokes([...first, stroke(2), stroke(3)]);

    expect(ctx.stroke).toHaveBeenCalledTimes(2);
    expect(ctx.clearRect).not.toHaveBeenCalled();
  });

  it("joins an appended point to where the pen was left", () => {
    const first = [stroke(0, true), stroke(1)];
    const { setStrokes } = renderWithCanvas(first);
    ctx.moveTo.mockClear();
    ctx.lineTo.mockClear();

    setStrokes([...first, stroke(2)]);

    // Continues from the previous point rather than restarting at the new one.
    expect(ctx.moveTo).toHaveBeenCalledWith(1, 1);
    expect(ctx.lineTo).toHaveBeenCalledWith(2, 2);
  });

  it("rebuilds the canvas when strokes are undone", () => {
    const full = [stroke(0, true), stroke(1), stroke(2)];
    const { setStrokes } = renderWithCanvas(full);
    ctx.stroke.mockClear();
    ctx.clearRect.mockClear();

    setStrokes(full.slice(0, 1));

    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
  });

  it("rebuilds the canvas when the array is replaced wholesale", () => {
    const first = [stroke(0, true), stroke(1)];
    const { setStrokes } = renderWithCanvas(first);
    ctx.stroke.mockClear();
    ctx.clearRect.mockClear();

    // A game state update hands over equal-looking but brand new objects; what
    // is on screen can no longer be trusted to be a prefix of it.
    setStrokes([stroke(0, true), stroke(1)]);

    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalledTimes(2);
  });

  it("clears the canvas when every stroke is gone", () => {
    const full = [stroke(0, true), stroke(1)];
    const { setStrokes } = renderWithCanvas(full);
    ctx.clearRect.mockClear();

    setStrokes([]);

    expect(ctx.clearRect).toHaveBeenCalled();
  });
});
