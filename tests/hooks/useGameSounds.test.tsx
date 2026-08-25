import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGameSounds } from "../../src/hooks/useGameSounds";
import { useGameStore } from "../../src/store/gameState";
import { useSoundStore } from "../../src/store/soundStore";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

vi.mock("../../src/store/soundStore", () => ({
  useSoundStore: vi.fn(),
}));

describe("useGameSounds — end of game", () => {
  const playSound = vi.fn();

  // Halfway through a match: two crewmates, one impostor still in the room.
  const base = {
    phase: "VOTING",
    players: [{ id: "crew1" }, { id: "crew2" }, { id: "imp" }],
    currentTurnPlayerId: null,
    myId: "crew1",
    amIImpostor: false,
    gameEnded: false,
    endedByHost: false,
    gameMode: "CLASSIC",
    gameOptions: { virtualVotingEnabled: true },
    ejectedId: null,
    impostorId: null,
    impostorIds: [],
    impostorGuessedCorrectly: false,
    impostorOutOfGuesses: false,
  };

  let storeState: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    storeState = { ...base };
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) => selector(storeState),
    );
    (useSoundStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) =>
        selector({ actions: { playSound } }),
    );
  });

  /** Renders in the pre-results state, then moves to RESULTS as the server would. */
  const advanceToResults = (results: Record<string, unknown>) => {
    const { rerender } = renderHook(() => useGameSounds());
    playSound.mockClear();
    storeState = { ...base, phase: "RESULTS", ...results };
    rerender();
  };

  it("plays victory for the crew when the last impostor is ejected", () => {
    // The server drops ejectedWasImpostor and remainingImpostorCount once the
    // game is over, so the winner has to come from the revealed roles.
    advanceToResults({
      gameEnded: true,
      ejectedId: "imp",
      impostorIds: ["imp"],
      players: [{ id: "crew1" }, { id: "crew2" }, { id: "imp" }],
    });

    expect(playSound).toHaveBeenCalledWith("victory");
  });

  it("plays defeat for the impostor who is ejected", () => {
    storeState = { ...base, myId: "imp", amIImpostor: true };
    advanceToResults({
      myId: "imp",
      amIImpostor: true,
      gameEnded: true,
      ejectedId: "imp",
      impostorIds: ["imp"],
    });

    expect(playSound).toHaveBeenCalledWith("defeat");
  });

  it("plays victory for the impostor who guesses the word", () => {
    advanceToResults({
      myId: "imp",
      amIImpostor: true,
      gameEnded: true,
      impostorIds: ["imp"],
      impostorGuessedCorrectly: true,
    });

    expect(playSound).toHaveBeenCalledWith("victory");
  });

  it("plays defeat for the crew when an impostor guesses the word", () => {
    advanceToResults({
      gameEnded: true,
      impostorIds: ["imp"],
      impostorGuessedCorrectly: true,
    });

    expect(playSound).toHaveBeenCalledWith("defeat");
  });

  it("plays the stalemate sound when the host just ends the game", () => {
    advanceToResults({
      gameEnded: true,
      endedByHost: true,
      impostorIds: ["imp"],
    });

    expect(playSound).toHaveBeenCalledWith("stalemate");
    expect(playSound).not.toHaveBeenCalledWith("victory");
    expect(playSound).not.toHaveBeenCalledWith("defeat");
    // Not the card-reveal stinger either: that one belongs to RoleReveal and
    // WordReveal, and sharing it here made the two moments sound the same.
    expect(playSound).not.toHaveBeenCalledWith("roleReveal");
  });

  it("rings the bell for everyone when a player calls an emergency meeting", () => {
    // The caller's flag and the VOTING phase arrive in the same server update,
    // and every client in the room sees both.
    storeState = { ...base, phase: "DRAWING" };
    const { rerender } = renderHook(() => useGameSounds());
    playSound.mockClear();
    storeState = {
      ...base,
      phase: "VOTING",
      players: [
        { id: "crew1" },
        { id: "crew2", hasStartedEmergencyVoting: true },
        { id: "imp" },
      ],
    };
    rerender();

    expect(playSound).toHaveBeenCalledWith("emergencyAlert");
    expect(playSound).not.toHaveBeenCalledWith("heartbeat");
  });

  it("rings the bell for the caller, whose own flag is raised optimistically", () => {
    // startEmergencyVoting sets the flag locally on click, one render before
    // the server's phase change arrives, so the caller sees the two halves of
    // the same event apart.
    const callerRaised = [
      { id: "crew1", hasStartedEmergencyVoting: true },
      { id: "crew2" },
      { id: "imp" },
    ];
    storeState = { ...base, phase: "DRAWING" };
    const { rerender } = renderHook(() => useGameSounds());

    storeState = { ...base, phase: "DRAWING", players: callerRaised };
    rerender();
    playSound.mockClear();

    storeState = { ...base, phase: "VOTING", players: callerRaised };
    rerender();

    expect(playSound).toHaveBeenCalledWith("emergencyAlert");
    expect(playSound).not.toHaveBeenCalledWith("heartbeat");
  });

  it("plays the heartbeat when voting simply follows the drawing round", () => {
    storeState = { ...base, phase: "DRAWING" };
    const { rerender } = renderHook(() => useGameSounds());
    playSound.mockClear();
    storeState = { ...base, phase: "VOTING" };
    rerender();

    expect(playSound).toHaveBeenCalledWith("heartbeat");
  });

  it("does not ring the bell again for a flag raised in an earlier round", () => {
    // The flag stays up for the rest of the match, so a later ordinary vote
    // must not be mistaken for a second meeting.
    const players = [
      { id: "crew1" },
      { id: "crew2", hasStartedEmergencyVoting: true },
      { id: "imp" },
    ];
    storeState = { ...base, phase: "DRAWING", players };
    const { rerender } = renderHook(() => useGameSounds());
    playSound.mockClear();
    storeState = { ...base, phase: "VOTING", players };
    rerender();

    expect(playSound).toHaveBeenCalledWith("heartbeat");
    expect(playSound).not.toHaveBeenCalledWith("emergencyAlert");
  });

  it("plays the ejection sound when the game continues with someone out", () => {
    advanceToResults({ ejectedId: "crew2" });

    expect(playSound).toHaveBeenCalledWith("playerEjected");
  });

  it("plays suspense when nobody is ejected and the game continues", () => {
    advanceToResults({ ejectedId: null });

    expect(playSound).toHaveBeenCalledWith("suspense");
  });
});
