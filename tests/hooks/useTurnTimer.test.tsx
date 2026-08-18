import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTurnTimer } from "../../src/hooks/useTurnTimer";
import { useGameStore } from "../../src/store/gameState";
import { useTurnTimerStore } from "../../src/store/turnTimerStore";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

// The hook publishes the countdown to useTurnTimerStore rather than returning
// it, so that a tick only re-renders the components that print the clock.
const timeLeft = () => useTurnTimerStore.getState().timeLeftMs;

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
    useTurnTimerStore.setState({ timeLeftMs: 0 });
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
    renderHook(() => useTurnTimer());
    expect(timeLeft()).toBe(20000);
  });

  it("counts down as time advances", () => {
    renderHook(() => useTurnTimer());

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(timeLeft()).toBe(19000);
  });

  it("ends the turn automatically when the timer expires on my turn", () => {
    renderHook(() => useTurnTimer());

    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(timeLeft()).toBe(0);
    expect(mockEndTurn).toHaveBeenCalledTimes(1);
  });

  it("never ends the turn when it is another player's turn", () => {
    setStore({ myId: "socket-456" }); // currentTurnPlayerId stays socket-123
    renderHook(() => useTurnTimer());

    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(timeLeft()).toBe(0);
    expect(mockEndTurn).not.toHaveBeenCalled();
  });

  it("does not start a countdown when there is no active turn", () => {
    setStore({ currentTurnPlayerId: null });
    renderHook(() => useTurnTimer());

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(timeLeft()).toBe(20000);
  });

  it("restarts the countdown when the active player changes", () => {
    const { rerender } = renderHook(() => useTurnTimer());

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(timeLeft()).toBe(15000);

    // A new turn begins for another player.
    setStore({ currentTurnPlayerId: "socket-456" });
    rerender();

    expect(timeLeft()).toBe(20000);
  });
});
