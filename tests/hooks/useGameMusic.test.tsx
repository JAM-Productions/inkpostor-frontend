import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackForPhase, useGameMusic } from "../../src/hooks/useGameMusic";
import { useGameStore, type GamePhase } from "../../src/store/gameState";
import { useSoundStore } from "../../src/store/soundStore";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

vi.mock("../../src/store/soundStore", () => ({
  useSoundStore: vi.fn(),
}));

describe("trackForPhase", () => {
  it("gives the lobby the only tune", () => {
    expect(trackForPhase("LOBBY", false)).toBe("lobby");
  });

  it("falls silent for the stings once the game is over", () => {
    expect(trackForPhase("RESULTS", true)).toBeNull();
  });

  it("keeps the tension up on a round result the game carries on from", () => {
    expect(trackForPhase("RESULTS", false)).toBe("tension");
  });

  it("puts the tension bed under every phase of play", () => {
    const inPlay: GamePhase[] = [
      "WORD_SELECTION",
      "ROLE_REVEAL",
      "WORD_REVEAL",
      "ORDER_INFO",
      "DRAWING",
      "VOTING",
      "IMPOSTOR_GUESS",
    ];
    inPlay.forEach((phase) => {
      expect(trackForPhase(phase, false)).toBe("tension");
    });
  });
});

describe("useGameMusic", () => {
  const setMusicTrack = vi.fn();

  let storeState: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    storeState = {
      phase: "LOBBY",
      gameEnded: false,
      roomId: "ROOM1",
      myName: "Alice",
    };
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) => selector(storeState),
    );
    (useSoundStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) =>
        selector({ actions: { setMusicTrack } }),
    );
  });

  it("asks for the lobby bed once the player is in a room", () => {
    renderHook(() => useGameMusic());
    expect(setMusicTrack).toHaveBeenCalledWith("lobby");
  });

  it("holds the bed through a round result and drops it when the game ends", () => {
    storeState = { ...storeState, phase: "VOTING" };
    const { rerender } = renderHook(() => useGameMusic());
    setMusicTrack.mockClear();

    // A round the game carries on from
    storeState = { ...storeState, phase: "RESULTS", gameEnded: false };
    rerender();
    expect(setMusicTrack).toHaveBeenLastCalledWith("tension");

    // ...and the one that ends it
    storeState = { ...storeState, gameEnded: true };
    rerender();
    expect(setMusicTrack).toHaveBeenLastCalledWith(null);
  });

  it("stays silent on the join screen, where the phase still reads LOBBY", () => {
    storeState = {
      phase: "LOBBY",
      gameEnded: false,
      roomId: null,
      myName: null,
    };
    renderHook(() => useGameMusic());
    expect(setMusicTrack).toHaveBeenCalledWith(null);
    expect(setMusicTrack).not.toHaveBeenCalledWith("lobby");
  });

  it("swaps beds when the game starts", () => {
    const { rerender } = renderHook(() => useGameMusic());
    setMusicTrack.mockClear();

    storeState = { ...storeState, phase: "DRAWING" };
    rerender();

    expect(setMusicTrack).toHaveBeenCalledWith("tension");
  });

  it("does not restart the bed on a re-render within the same phase", () => {
    const { rerender } = renderHook(() => useGameMusic());
    setMusicTrack.mockClear();

    rerender();

    expect(setMusicTrack).not.toHaveBeenCalled();
  });

  it("stops the music when it goes away", () => {
    const { unmount } = renderHook(() => useGameMusic());
    setMusicTrack.mockClear();

    unmount();

    expect(setMusicTrack).toHaveBeenCalledWith(null);
  });
});
