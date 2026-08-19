import type { StrokeData } from "../store/gameState";

/**
 * A stretch of the drawing made by one player, as `[start, end)` indices into
 * `canvasStrokes`.
 */
export interface AuthorRun {
  /** `null` for points drawn before anyone was named — see `buildAuthorRuns`. */
  playerId: string | null;
  start: number;
  end: number;
}

/**
 * Splits the drawing into the stretches each player drew.
 *
 * The server names only the first point of every batch it accepts, so the name
 * of a point is the last one seen at or before it. A batch is one frame of
 * drawing, which would make for thousands of one-frame runs; consecutive
 * stretches by the same player are merged, leaving roughly one run per turn.
 *
 * Points before the first named one — the tail of a drawing that was already in
 * progress when an older server handed it over — get a `null` run rather than
 * being guessed at.
 */
export const buildAuthorRuns = (strokes: StrokeData[]): AuthorRun[] => {
  const runs: AuthorRun[] = [];

  for (let i = 0; i < strokes.length; i++) {
    const named = strokes[i].playerId;
    const current = runs[runs.length - 1];

    if (current && (named === undefined || named === current.playerId)) {
      current.end = i + 1;
      continue;
    }

    runs.push({ playerId: named ?? null, start: i, end: i + 1 });
  }

  return runs;
};

/**
 * The players who drew, in the order they first put pen to paper. Whether some
 * of the drawing is unattributed is reported separately: `null` is not a player
 * and does not belong in a list of them.
 */
export const getAuthorOrder = (
  runs: AuthorRun[],
): { playerIds: string[]; hasUnknown: boolean } => {
  const playerIds: string[] = [];
  // The list doubles as the answer, so first appearance decides the order; what
  // it cannot do is answer "seen already" without walking itself every time.
  const seen = new Set<string>();
  let hasUnknown = false;

  for (const run of runs) {
    if (run.playerId === null) {
      hasUnknown = true;
    } else if (!seen.has(run.playerId)) {
      seen.add(run.playerId);
      playerIds.push(run.playerId);
    }
  }

  return { playerIds, hasUnknown };
};

/**
 * The run a point belongs to, or `null` past the end of the drawing.
 *
 * `from` is where to start looking. The replay walks the drawing forwards and
 * passes back the run it landed on last time, which keeps the whole animation
 * linear instead of searching the run list on every frame.
 */
export const findRunAt = (
  runs: AuthorRun[],
  index: number,
  from = 0,
): number => {
  for (let i = Math.max(0, from); i < runs.length; i++) {
    if (index < runs[i].end) return index >= runs[i].start ? i : -1;
  }
  return -1;
};
