import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTurnTimer } from "../../src/hooks/useTurnTimer";
import { useGameStore } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("useTurnTimer", () => {
  const mockEndTurn = vi.fn();

  let storeState: any;

  const mockStateBase = {
    myId: "socket-123",
    currentTurnPlayerId: "socket-123", // my turn by default
    gameOptions: { roundTime: 20 },
    actions: { endTurn: mockEndTurn },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    storeState = { ...mockStateBase };
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(storeState),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setStore = (overrides = {}) => {
    storeState = { ...mockStateBase, ...overrides };
  };

  it("initializes to the configured round time in milliseconds", () => {
    const { result } = renderHook(() => useTurnTimer());
    expect(result.current).toBe(20000);
  });

  it("counts down as time advances", () => {
    const { result } = renderHook(() => useTurnTimer());

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(19000);
  });

  it("ends the turn automatically when the timer expires on my turn", () => {
    const { result } = renderHook(() => useTurnTimer());

    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(result.current).toBe(0);
    expect(mockEndTurn).toHaveBeenCalledTimes(1);
  });

  it("never ends the turn when it is another player's turn", () => {
    setStore({ myId: "socket-456" }); // currentTurnPlayerId stays socket-123
    const { result } = renderHook(() => useTurnTimer());

    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(result.current).toBe(0);
    expect(mockEndTurn).not.toHaveBeenCalled();
  });

  it("does not start a countdown when there is no active turn", () => {
    setStore({ currentTurnPlayerId: null });
    const { result } = renderHook(() => useTurnTimer());

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(20000);
  });

  it("restarts the countdown when the active player changes", () => {
    const { result, rerender } = renderHook(() => useTurnTimer());

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(15000);

    // A new turn begins for another player.
    setStore({ currentTurnPlayerId: "socket-456" });
    rerender();

    expect(result.current).toBe(20000);
  });
});
