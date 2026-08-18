import type { StrokeData } from "../store/gameState";

/**
 * The stretch of the drawing made during one round, as `[start, end)` indices
 * into `canvasStrokes`.
 */
export interface RoundSegment {
  /** `null` for points drawn before any round was stamped. */
  round: number | null;
  start: number;
  end: number;
}

/**
 * Splits the drawing into rounds.
 *
 * Only matters when the host turned off wiping the canvas each round: the
 * drawing then holds every round at once, and the stamp the server puts on the
 * first point of each batch is the only thing that says where one ended. Like
 * authorship, the round of a point is the last one stamped at or before it.
 *
 * A drawing that is all one round comes back as a single segment, which is what
 * lets the caller ask "is there more than one of these?" rather than having to
 * know what the host chose.
 */
export const buildRoundSegments = (strokes: StrokeData[]): RoundSegment[] => {
  const segments: RoundSegment[] = [];

  for (let i = 0; i < strokes.length; i++) {
    const stamped = strokes[i].round;
    const current = segments[segments.length - 1];

    if (current && (stamped === undefined || stamped === current.round)) {
      current.end = i + 1;
      continue;
    }

    segments.push({ round: stamped ?? null, start: i, end: i + 1 });
  }

  return segments;
};

/**
 * Merges the segments of each round into one entry per round, newest last.
 *
 * A round is contiguous in practice — play does not go back to an earlier one —
 * but nothing in the data promises it, and a selector must not offer the same
 * round twice.
 */
export const getRoundSpans = (
  segments: RoundSegment[],
): { round: number | null; start: number; end: number }[] => {
  const spans = new Map<number | null, { start: number; end: number }>();

  for (const segment of segments) {
    const span = spans.get(segment.round);
    if (span) {
      span.start = Math.min(span.start, segment.start);
      span.end = Math.max(span.end, segment.end);
    } else {
      spans.set(segment.round, { start: segment.start, end: segment.end });
    }
  }

  return [...spans.entries()]
    .map(([round, span]) => ({ round, ...span }))
    .sort((a, b) => a.start - b.start);
};
