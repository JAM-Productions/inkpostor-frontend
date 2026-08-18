import { describe, it, expect } from "vitest";
import {
  buildAuthorRuns,
  getAuthorOrder,
  findRunAt,
} from "../../src/lib/strokeAuthors";
import type { StrokeData } from "../../src/store/gameState";

const point = (x: number, playerId?: string): StrokeData => ({
  x,
  y: x,
  color: "#000",
  isNewStroke: x === 0,
  ...(playerId ? { playerId } : {}),
});

describe("buildAuthorRuns", () => {
  it("credits a point to the last player named before it", () => {
    const runs = buildAuthorRuns([
      point(0, "alice"),
      point(1),
      point(2),
      point(3, "bob"),
      point(4),
    ]);

    expect(runs).toEqual([
      { playerId: "alice", start: 0, end: 3 },
      { playerId: "bob", start: 3, end: 5 },
    ]);
  });

  it("merges the batches of one turn into a single run", () => {
    // The server names the first point of every batch, and a batch is one frame
    // of drawing: without merging, a turn would come out as hundreds of runs.
    const runs = buildAuthorRuns([
      point(0, "alice"),
      point(1),
      point(2, "alice"),
      point(3),
      point(4, "alice"),
    ]);

    expect(runs).toEqual([{ playerId: "alice", start: 0, end: 5 }]);
  });

  it("leaves a drawing that opens unnamed unattributed rather than guessing", () => {
    // What an older server hands over: no names anywhere in the payload.
    const runs = buildAuthorRuns([point(0), point(1), point(2, "bob")]);

    expect(runs).toEqual([
      { playerId: null, start: 0, end: 2 },
      { playerId: "bob", start: 2, end: 3 },
    ]);
  });

  it("has nothing to say about an empty canvas", () => {
    expect(buildAuthorRuns([])).toEqual([]);
  });
});

describe("getAuthorOrder", () => {
  it("lists players once, in the order they first drew", () => {
    const runs = buildAuthorRuns([
      point(0, "bob"),
      point(1, "alice"),
      point(2, "bob"),
    ]);

    expect(getAuthorOrder(runs)).toEqual({
      playerIds: ["bob", "alice"],
      hasUnknown: false,
    });
  });

  it("reports the unattributed part apart from the players", () => {
    const runs = buildAuthorRuns([point(0), point(1, "alice")]);

    expect(getAuthorOrder(runs)).toEqual({
      playerIds: ["alice"],
      hasUnknown: true,
    });
  });
});

describe("findRunAt", () => {
  const runs = buildAuthorRuns([
    point(0, "alice"),
    point(1),
    point(2, "bob"),
    point(3),
  ]);

  it("finds the run a point belongs to", () => {
    expect(findRunAt(runs, 0)).toBe(0);
    expect(findRunAt(runs, 1)).toBe(0);
    expect(findRunAt(runs, 2)).toBe(1);
    expect(findRunAt(runs, 3)).toBe(1);
  });

  it("reports nothing past the end of the drawing", () => {
    expect(findRunAt(runs, 4)).toBe(-1);
  });

  it("resumes from where the last lookup left off", () => {
    // How the replay uses it: walking forward, never searching from scratch.
    expect(findRunAt(runs, 3, 1)).toBe(1);
  });
});
