import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCanvasDrawing } from "../../src/hooks/useCanvasDrawing";
import { useGameStore, type Player } from "../../src/store/gameState";
import { DEFAULT_CANVAS_COLOR } from "../../src/lib/canvasColors";
import { getPlayerCanvasColor } from "../../src/lib/playerColors";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

// The hook never attaches its refs to the DOM in these unit tests, so
// `getCoordinates` falls back to {0, 0} and the canvas effects no-op. That lets
// us exercise the ink accounting in isolation; coordinate scaling and the
// distance-based ink cost are covered by the Canvas integration test.
describe("useCanvasDrawing", () => {
  const mockDrawStroke = vi.fn();
  const mockUndoStroke = vi.fn();

  let storeState: any;

  const mockStateBase = {
    myId: "socket-123",
    hostId: "socket-host",
    players: [{ id: "socket-host" }, { id: "socket-123" }],
    currentTurnPlayerId: "socket-123", // my turn by default
    canvasStrokes: [],
    gameOptions: { unlimitedInk: false },
    actions: { drawStroke: mockDrawStroke, undoStroke: mockUndoStroke },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    storeState = { ...mockStateBase };
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(storeState),
    );
  });

  const setStore = (overrides = {}) => {
    storeState = { ...mockStateBase, ...overrides };
  };

  const makeEvent = () => ({ preventDefault: vi.fn() }) as any;

  it("starts a new stroke and consumes a dot of ink", () => {
    const { result } = renderHook(() => useCanvasDrawing());

    act(() => {
      result.current.startDrawing(makeEvent());
    });

    expect(mockDrawStroke).toHaveBeenCalledWith({
      x: 0,
      y: 0,
      color: DEFAULT_CANVAS_COLOR,
      isNewStroke: true,
    });
    // DOT_INK_COST (5) of MAX_INK (1000) => 0.5%
    expect(result.current.inkPercentage).toBeCloseTo(0.5);
    expect(result.current.isOutOfInk).toBe(false);
  });

  it("does not draw when it is not my turn", () => {
    setStore({ myId: "socket-999" });
    const { result } = renderHook(() => useCanvasDrawing());

    act(() => {
      result.current.startDrawing(makeEvent());
    });

    expect(mockDrawStroke).not.toHaveBeenCalled();
    expect(result.current.inkPercentage).toBe(0);
  });

  it("never consumes ink when unlimited ink is enabled", () => {
    setStore({ gameOptions: { unlimitedInk: true } });
    const { result } = renderHook(() => useCanvasDrawing());

    act(() => {
      result.current.startDrawing(makeEvent());
    });

    expect(mockDrawStroke).toHaveBeenCalledTimes(1);
    expect(result.current.inkPercentage).toBe(0);
    expect(result.current.isOutOfInk).toBe(false);
  });

  it("undoes the last stroke and restores its ink", () => {
    const { result } = renderHook(() => useCanvasDrawing());

    act(() => {
      result.current.startDrawing(makeEvent());
    });
    expect(result.current.inkPercentage).toBeCloseTo(0.5);

    act(() => {
      result.current.undoLastStroke();
    });

    expect(mockUndoStroke).toHaveBeenCalledTimes(1);
    expect(result.current.inkPercentage).toBe(0);
  });

  it("does nothing on undo when there are no strokes", () => {
    const { result } = renderHook(() => useCanvasDrawing());

    act(() => {
      result.current.undoLastStroke();
    });

    expect(mockUndoStroke).not.toHaveBeenCalled();
  });

  it("runs out of ink after enough strokes and blocks further drawing", () => {
    const { result } = renderHook(() => useCanvasDrawing());

    // Each dot costs 5 ink; 200 dots reach MAX_INK (1000).
    for (let i = 0; i < 200; i++) {
      act(() => {
        result.current.startDrawing(makeEvent());
      });
    }

    expect(result.current.isOutOfInk).toBe(true);
    const callsWhenExhausted = mockDrawStroke.mock.calls.length;

    // Further attempts are ignored while out of ink.
    act(() => {
      result.current.startDrawing(makeEvent());
    });
    expect(mockDrawStroke.mock.calls.length).toBe(callsWhenExhausted);
  });

  it("resets the ink supply when a new turn of mine begins", () => {
    const { result, rerender } = renderHook(() => useCanvasDrawing());

    act(() => {
      result.current.startDrawing(makeEvent());
    });
    expect(result.current.inkPercentage).toBeCloseTo(0.5);

    // Another player's turn: ink is kept, not reset.
    setStore({ currentTurnPlayerId: "socket-456" });
    rerender();
    expect(result.current.inkPercentage).toBeCloseTo(0.5);

    // My turn starts again: ink is replenished.
    setStore({ currentTurnPlayerId: "socket-123" });
    rerender();
    expect(result.current.inkPercentage).toBe(0);
  });

  it("draws in my player color when the palette is disabled", () => {
    setStore({
      gameOptions: { unlimitedInk: false, playerColorsEnabled: true },
    });
    const { result } = renderHook(() => useCanvasDrawing());

    // Whatever the palette had picked is ignored
    act(() => {
      result.current.setColor("#ffffff");
    });
    act(() => {
      result.current.startDrawing(makeEvent());
    });

    // Second entry of the player list, so the second player style
    const myColor = getPlayerCanvasColor(
      "socket-123",
      "socket-host",
      mockStateBase.players as Player[],
    );
    expect(myColor).not.toBe("#ffffff");
    expect(result.current.color).toBe(myColor);
    expect(mockDrawStroke).toHaveBeenCalledWith({
      x: 0,
      y: 0,
      color: myColor,
      isNewStroke: true,
    });
  });

  it("draws in the picked color when the palette is enabled", () => {
    const { result } = renderHook(() => useCanvasDrawing());

    act(() => {
      result.current.setColor("#ffffff");
    });
    act(() => {
      result.current.startDrawing(makeEvent());
    });

    expect(result.current.color).toBe("#ffffff");
    expect(mockDrawStroke).toHaveBeenCalledWith({
      x: 0,
      y: 0,
      color: "#ffffff",
      isNewStroke: true,
    });
  });
});
