import { describe, it, expect } from "vitest";
import {
  applyModeLockedOptions,
  clampImpostorCount,
  DEFAULT_GAME_MODE,
  DEFAULT_GAME_OPTIONS,
  getMaxImpostors,
  MODE_LOCKED_OPTIONS,
  MODE_OPTION_SECTIONS,
  usesVotingPhase,
} from "../../src/lib/constants";
import type { GameOptions } from "../../src/store/gameState";

// These two tables are copies of the ones the server enforces (its own
// `constants.ts`). Every other test reads the values from here, so a copy that
// drifted from the server would sail through the suite: the lobby would count
// the wrong "changed options", the reset button would save something the server
// then overrides, and the modal would mask an option the server left alone.
// Hence the literals — they are the only place the drift can be caught without
// running the whole thing end to end.
describe("the options the client mirrors from the server", () => {
  it("starts a room on the same defaults the server does", () => {
    expect(DEFAULT_GAME_OPTIONS).toEqual({
      roundTime: 20,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      playerColorsEnabled: true,
      impostorCount: 1,
      revealImpostorTeammates: true,
      impostorGuessEnabled: true,
      impostorGuessAttempts: 1,
      impostorLosesWhenOutOfGuesses: false,
      hideHint: false,
      turnOrderMode: "RANDOM_STARTER",
      preventRepeatImpostors: true,
      virtualVotingEnabled: false,
    });
    expect(DEFAULT_GAME_MODE).toBe("CLASSIC");
  });

  it("takes the same options over in each mode", () => {
    const spokenLocks = {
      roundTime: 20,
      unlimitedInk: false,
      clearCanvasEachRound: true,
      playerColorsEnabled: false,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 1,
      impostorLosesWhenOutOfGuesses: false,
    };

    expect(MODE_LOCKED_OPTIONS).toEqual({
      CLASSIC: {},
      CUSTOM_WORD: {
        impostorGuessEnabled: false,
        impostorLosesWhenOutOfGuesses: false,
      },
      HOT_WORD: { clearCanvasEachRound: true },
      ORIGINAL: spokenLocks,
      ORIGINAL_CHAOS: spokenLocks,
    });
  });
});

describe("usesVotingPhase", () => {
  it("always plays the voting phase in a mode that draws", () => {
    // The option exists for the table, not for the canvas: a drawing round ends
    // in VOTING whatever it says.
    const options = { ...DEFAULT_GAME_OPTIONS, virtualVotingEnabled: false };

    expect(usesVotingPhase("CLASSIC", options)).toBe(true);
    expect(usesVotingPhase("CUSTOM_WORD", options)).toBe(true);
    expect(usesVotingPhase("HOT_WORD", options)).toBe(true);
  });

  it("only plays it in a spoken mode when the host turned it on", () => {
    const off = { ...DEFAULT_GAME_OPTIONS, virtualVotingEnabled: false };
    const on = { ...DEFAULT_GAME_OPTIONS, virtualVotingEnabled: true };

    expect(usesVotingPhase("ORIGINAL", off)).toBe(false);
    expect(usesVotingPhase("ORIGINAL_CHAOS", off)).toBe(false);
    expect(usesVotingPhase("ORIGINAL", on)).toBe(true);
    expect(usesVotingPhase("ORIGINAL_CHAOS", on)).toBe(true);
  });

  it("is only offered as an option where it means something", () => {
    expect(MODE_OPTION_SECTIONS.ORIGINAL).toContain("virtualVoting");
    expect(MODE_OPTION_SECTIONS.ORIGINAL_CHAOS).toContain("virtualVoting");
    expect(MODE_OPTION_SECTIONS.CLASSIC).not.toContain("virtualVoting");
  });
});

// The same rule the server applies when it picks the impostors, so a room never
// shows a count it would then cut on start.
describe("getMaxImpostors", () => {
  it.each([
    [0, 1],
    [3, 1],
    [4, 1],
    [5, 2],
    [6, 2],
    [7, 3],
    [10, 4],
  ])("allows %i players %i impostors", (playerCount, expected) => {
    expect(getMaxImpostors(playerCount)).toBe(expected);
  });

  it("never goes below one, not even in an empty room", () => {
    expect(getMaxImpostors(-1)).toBe(1);
  });
});

describe("clampImpostorCount", () => {
  it("leaves a count the room can hold alone", () => {
    expect(clampImpostorCount(2, 5)).toBe(2);
    expect(clampImpostorCount(3, 7)).toBe(3);
  });

  it("cuts a count the players no longer allow", () => {
    // The five players it was chosen for are down to four
    expect(clampImpostorCount(2, 4)).toBe(1);
    expect(clampImpostorCount(3, 5)).toBe(2);
  });

  it("keeps at least one impostor", () => {
    expect(clampImpostorCount(0, 7)).toBe(1);
  });
});

describe("applyModeLockedOptions", () => {
  // The host went for a long drawing game with colours and guessing on
  const hostChoices: GameOptions = {
    ...DEFAULT_GAME_OPTIONS,
    roundTime: 40,
    unlimitedInk: true,
    clearCanvasEachRound: false,
    impostorGuessAttempts: 3,
    impostorLosesWhenOutOfGuesses: true,
    hideHint: true,
  };

  it("leaves the choices alone in a mode that claims nothing", () => {
    expect(applyModeLockedOptions(hostChoices, "CLASSIC")).toEqual(hostChoices);
  });

  it("forces only what the mode claims", () => {
    // HOT_WORD draws a new word every round, so it owns the canvas clearing
    expect(applyModeLockedOptions(hostChoices, "HOT_WORD")).toEqual({
      ...hostChoices,
      clearCanvasEachRound: true,
    });
  });

  it("neutralises every drawing option in a spoken mode", () => {
    const spoken = applyModeLockedOptions(hostChoices, "ORIGINAL");

    expect(spoken).toMatchObject({
      roundTime: 20,
      unlimitedInk: false,
      playerColorsEnabled: false,
      impostorGuessEnabled: false,
      impostorGuessAttempts: 1,
      impostorLosesWhenOutOfGuesses: false,
    });
    // ...while the options a spoken mode does own are still the host's
    expect(spoken.hideHint).toBe(true);
    expect(spoken.turnOrderMode).toBe(hostChoices.turnOrderMode);
  });

  it("does not touch the object it is given", () => {
    const before = { ...hostChoices };

    applyModeLockedOptions(hostChoices, "ORIGINAL");

    expect(hostChoices).toEqual(before);
  });

  it("falls back to no locks for a mode it does not know yet", () => {
    // The server can be deployed first: an unknown mode must render the plain
    // options instead of blowing up the modal.
    const unknownMode = "FUTURE_MODE" as Parameters<
      typeof applyModeLockedOptions
    >[1];

    expect(applyModeLockedOptions(hostChoices, unknownMode)).toEqual(
      hostChoices,
    );
  });
});
