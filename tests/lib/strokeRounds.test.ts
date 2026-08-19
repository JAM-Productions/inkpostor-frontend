import { describe, it, expect } from "vitest";
import { buildRoundSegments, getRoundSpans } from "../../src/lib/strokeRounds";
import type { StrokeData } from "../../src/store/gameState";

const point = (x: number, round?: number): StrokeData => ({
  x,
  y: x,
  color: "#000",
  isNewStroke: x === 0,
  ...(round === undefined ? {} : { round }),
});

describe("buildRoundSegments", () => {
  it("puts a point in the last round stamped before it", () => {
    const segments = buildRoundSegments([
      point(0, 1),
      point(1),
      point(2, 2),
      point(3),
    ]);

    expect(segments).toEqual([
      { round: 1, start: 0, end: 2 },
      { round: 2, start: 2, end: 4 },
    ]);
  });

  it("merges the batches of one round into a single segment", () => {
    const segments = buildRoundSegments([
      point(0, 1),
      point(1),
      point(2, 1),
      point(3, 1),
    ]);

    expect(segments).toEqual([{ round: 1, start: 0, end: 4 }]);
  });

  it("reports a drawing of one round as one segment", () => {
    // What a wiped-each-round canvas always looks like, and the answer the
    // modal reads to decide there is nothing to choose between.
    expect(buildRoundSegments([point(0, 3), point(1)])).toEqual([
      { round: 3, start: 0, end: 2 },
    ]);
  });

  it("leaves an unstamped opening unattributed rather than guessing", () => {
    expect(buildRoundSegments([point(0), point(1, 2)])).toEqual([
      { round: null, start: 0, end: 1 },
      { round: 2, start: 1, end: 2 },
    ]);
  });
});

describe("getRoundSpans", () => {
  it("gives one span per round, oldest first", () => {
    const spans = getRoundSpans(
      buildRoundSegments([point(0, 1), point(1), point(2, 2), point(3)]),
    );

    expect(spans).toEqual([
      { round: 1, start: 0, end: 2 },
      { round: 2, start: 2, end: 4 },
    ]);
  });

  it("offers a round once even if the drawing comes back to it", () => {
    // Play does not go back to an earlier round, but nothing in the data says
    // so, and a selector must not list the same round twice.
    const spans = getRoundSpans(
      buildRoundSegments([point(0, 1), point(1, 2), point(2, 1)]),
    );

    expect(spans).toEqual([
      { round: 1, start: 0, end: 3 },
      { round: 2, start: 1, end: 2 },
    ]);
  });

  it("has nothing to offer for an empty canvas", () => {
    expect(getRoundSpans(buildRoundSegments([]))).toEqual([]);
  });
});
