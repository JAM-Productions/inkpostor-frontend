import { describe, it, expect } from "vitest";
import {
  areAllImpostorsDefeated,
  resolveImpostorIds,
} from "../../src/lib/gameOutcome";

describe("resolveImpostorIds", () => {
  it("prefers the impostor list when the room reports one", () => {
    expect(resolveImpostorIds(["a", "b"], "c")).toEqual(new Set(["a", "b"]));
  });

  it("falls back to the single impostor id", () => {
    expect(resolveImpostorIds([], "c")).toEqual(new Set(["c"]));
    expect(resolveImpostorIds(null, "c")).toEqual(new Set(["c"]));
  });

  it("is empty when the roles are still secret", () => {
    expect(resolveImpostorIds(null, null)).toEqual(new Set());
  });
});

describe("areAllImpostorsDefeated", () => {
  const crew = { id: "crew1" };
  const base = {
    ejectedId: null,
    impostorGuessedCorrectly: false,
    impostorOutOfGuesses: false,
  };

  it("counts the player this result ejects, who is not flagged yet", () => {
    expect(
      areAllImpostorsDefeated({
        ...base,
        players: [crew, { id: "imp", isEjected: false }],
        impostorIdSet: new Set(["imp"]),
        ejectedId: "imp",
      }),
    ).toBe(true);
  });

  it("is false while an impostor is still in the room", () => {
    expect(
      areAllImpostorsDefeated({
        ...base,
        players: [crew, { id: "imp1", isEjected: true }, { id: "imp2" }],
        impostorIdSet: new Set(["imp1", "imp2"]),
        ejectedId: "imp1",
      }),
    ).toBe(false);
  });

  it("is true when the impostors run out of guesses", () => {
    expect(
      areAllImpostorsDefeated({
        ...base,
        players: [crew, { id: "imp" }],
        impostorIdSet: new Set(["imp"]),
        impostorOutOfGuesses: true,
      }),
    ).toBe(true);
  });

  it("is false when an impostor guessed the word, ejected or not", () => {
    expect(
      areAllImpostorsDefeated({
        ...base,
        players: [crew, { id: "imp", isEjected: true }],
        impostorIdSet: new Set(["imp"]),
        impostorGuessedCorrectly: true,
      }),
    ).toBe(false);
  });

  it("ignores players who left the room entirely", () => {
    // A vote-kicked impostor is gone from the list, not flagged as ejected.
    expect(
      areAllImpostorsDefeated({
        ...base,
        players: [crew],
        impostorIdSet: new Set(["kicked"]),
      }),
    ).toBe(true);
  });
});
