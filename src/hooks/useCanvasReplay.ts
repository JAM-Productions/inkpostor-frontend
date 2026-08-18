import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { StrokeData } from "../store/gameState";
import { findRunAt, type AuthorRun } from "../lib/strokeAuthors";
import { getFitTransform, getStrokeBounds } from "../lib/strokeGeometry";

export type ReplayStatus = "playing" | "finished";

export interface UseCanvasReplay {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  status: ReplayStatus;
  /** Who is drawing right now. `null` once the replay is over. */
  currentAuthorId: string | null;
  replay: () => void;
}

/** How long a full replay lasts, however much was drawn. */
const MAX_DURATION_MS = 4500;
/** Floor, so a drawing of six points is still a drawing and not a flash. */
const MIN_DURATION_MS = 900;
const MS_PER_POINT = 6;

/** Line width the canvas was drawn with, before it is scaled to the preview. */
const SOURCE_LINE_WIDTH = 4;
const MIN_LINE_WIDTH = 1.5;
const PADDING = 16;

/** What is left of the other players once someone is singled out. */
const DIMMED_ALPHA = 0.14;
/** What is left of the rounds that came before the one on show. Fainter than
 * the dimming above, so the two never read as the same thing: one is a player
 * standing back, the other is a round that is already over. */
const BACKDROP_ALPHA = 0.09;

/** Stable default, so a hook with no backdrop does not restart on every render. */
const EMPTY_STROKES: StrokeData[] = [];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Replays a finished drawing stroke by stroke, and afterwards singles out one
 * player's part of it.
 *
 * The animation paints only the points that came due since the last frame, the
 * same way the live canvas does: replaying the whole array every frame is what
 * turns a long drawing quadratic. Singling a player out is the one thing that
 * repaints in full, and it happens on a click rather than sixty times a second.
 */
export const useCanvasReplay = (
  strokes: StrokeData[],
  runs: AuthorRun[],
  isolatedPlayerId: string | null,
  /**
   * What decides the framing, when it is more than what is being replayed.
   * Replaying one round of a canvas that was never wiped has to keep the frame
   * of the whole drawing: fitted to itself, a round would be blown up to fill
   * the sheet and lose the one thing its position was saying.
   */
  framing: StrokeData[] = strokes,
  /** What was already on the paper: laid down faint, and never animated. */
  backdrop: StrokeData[] = EMPTY_STROKES,
): UseCanvasReplay => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [status, setStatus] = useState<ReplayStatus>("playing");
  const [currentAuthorId, setCurrentAuthorId] = useState<string | null>(null);
  // Bumped by `replay`, which is the only thing that restarts the animation
  // without the drawing itself having changed.
  const [playToken, setPlayToken] = useState(0);

  const frame = useRef<number | null>(null);
  const painted = useRef(0);
  const runCursor = useRef(0);
  // Who the canvas is currently showing singled out, so that asking for what is
  // already on it costs nothing. The animation ends on the whole drawing, which
  // is the same thing as nobody being singled out.
  const shown = useRef<string | null>(null);
  // Whether the loop currently owns the canvas. `status` cannot answer that: it
  // is state, so an effect started in the same commit as a restart still reads
  // the value from before it — and would repaint over an animation that has
  // already begun.
  const animating = useRef(false);
  // Whether the next painting is one the player asked to watch. True to begin
  // with, because opening the preview is one of those askings.
  const animateNext = useRef(true);

  const transform = useMemo(
    () =>
      getFitTransform(
        getStrokeBounds(framing),
        size?.width ?? 0,
        size?.height ?? 0,
        PADDING,
      ),
    [framing, size],
  );

  // Keep the canvas buffer the size of its CSS box. Resizing it wipes what is
  // on it, so a new size means the replay starts over rather than resuming into
  // a canvas that no longer holds the first half.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      setSize((current) =>
        current?.width === width && current?.height === height
          ? current
          : { width, height },
      );
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  /**
   * Paints `points[from, to)` onto the canvas at one opacity.
   *
   * A range that opens mid-line is joined to the point before it, so any stretch
   * of a drawing can be painted on its own and still come out continuous.
   *
   * Points that carry on the same line in the same colour go down as one path.
   * Stroking them one segment at a time is what makes a faded line come out
   * stippled: the round caps of neighbouring segments overlap, and at anything
   * under full opacity every join composites twice and shows as a dot.
   */
  const paintPoints = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      points: StrokeData[],
      from: number,
      to: number,
      alpha: number,
    ) => {
      if (to <= from) return;
      const { scale, offsetX, offsetY } = transform;
      const projectX = (x: number) => x * scale + offsetX;
      const projectY = (y: number) => y * scale + offsetY;

      ctx.globalAlpha = alpha;
      let pen = from > 0 && !points[from].isNewStroke ? points[from - 1] : null;
      let openPath = false;
      let pathColor = "";

      for (let i = from; i < to; i++) {
        const stroke = points[i];
        const previous = stroke.isNewStroke ? null : pen;

        if (!openPath || stroke.color !== pathColor || !previous) {
          if (openPath) ctx.stroke();
          ctx.beginPath();
          ctx.strokeStyle = stroke.color;
          pathColor = stroke.color;
          openPath = true;
          ctx.moveTo(
            projectX(previous ? previous.x : stroke.x),
            projectY(previous ? previous.y : stroke.y),
          );
        }

        ctx.lineTo(projectX(stroke.x), projectY(stroke.y));
        pen = stroke;
      }
      if (openPath) ctx.stroke();
      ctx.globalAlpha = 1;
    },
    [transform],
  );

  const paintRange = useCallback(
    (ctx: CanvasRenderingContext2D, from: number, to: number, alpha: number) =>
      paintPoints(ctx, strokes, from, to, alpha),
    [paintPoints, strokes],
  );

  /**
   * Lays what came before down underneath, faint and all at once.
   *
   * It is not what is being replayed, so it is never animated: it is already
   * there when the pen starts moving, the way the round it belongs to was
   * already on the paper when this one began.
   */
  const paintBackdrop = useCallback(
    (ctx: CanvasRenderingContext2D) =>
      paintPoints(ctx, backdrop, 0, backdrop.length, BACKDROP_ALPHA),
    [paintPoints, backdrop],
  );

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return null;
    if (canvas.width !== size.width || canvas.height !== size.height) {
      canvas.width = size.width;
      canvas.height = size.height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(
      MIN_LINE_WIDTH,
      SOURCE_LINE_WIDTH * transform.scale,
    );
    return ctx;
  }, [size, transform]);

  // The animation. Restarts whenever the drawing, the box or `replay` says so.
  useEffect(() => {
    const ctx = getContext();
    if (!ctx || !size) return;

    ctx.clearRect(0, 0, size.width, size.height);
    paintBackdrop(ctx);
    painted.current = 0;
    runCursor.current = 0;
    animating.current = false;

    // Drawing it stroke by stroke is something the player asks for: on opening,
    // and every time afterwards through `replay`. Everything else that brings
    // the effect back round — a round picked out of the carousel, a box that
    // changed size — is the same drawing being put back, and putting it back is
    // all it should do.
    const shouldAnimate = animateNext.current;
    animateNext.current = false;

    if (!shouldAnimate || strokes.length === 0 || prefersReducedMotion()) {
      paintRange(ctx, 0, strokes.length, 1);
      painted.current = strokes.length;
      shown.current = null;
      setStatus("finished");
      setCurrentAuthorId(null);
      return;
    }

    setStatus("playing");
    const duration = Math.min(
      MAX_DURATION_MS,
      Math.max(MIN_DURATION_MS, strokes.length * MS_PER_POINT),
    );
    // The clock starts on the first frame rather than here. What a frame is
    // handed is the time it began, which can predate the moment this effect
    // asked for it — and a negative elapsed runs the replay backwards off the
    // front of the drawing.
    let startedAt: number | null = null;

    const step = (now: number) => {
      if (startedAt === null) startedAt = now;
      const elapsed = now - startedAt;
      const target = Math.min(
        strokes.length,
        Math.ceil((elapsed / duration) * strokes.length),
      );

      paintRange(ctx, painted.current, target, 1);
      painted.current = target;

      if (target > 0) {
        // The run list is walked forwards alongside the drawing, so naming the
        // player who is drawing costs nothing per frame.
        const cursor = findRunAt(runs, target - 1, runCursor.current);
        if (cursor !== -1) {
          runCursor.current = cursor;
          const author = runs[cursor].playerId;
          setCurrentAuthorId((current) =>
            current === author ? current : author,
          );
        }
      }

      if (target >= strokes.length) {
        // The frames drew the line in short bursts, and each burst was its own
        // stroke. Where two of them meet the antialiased ends blend rather than
        // add up, so a line falling between pixel columns settles with a seam at
        // every join and reads as beaded. Now that all of it is here, it goes
        // down once more as whole paths — a single pass, against a picture that
        // is then stared at for the length of a vote.
        ctx.clearRect(0, 0, size.width, size.height);
        paintBackdrop(ctx);
        paintRange(ctx, 0, strokes.length, 1);
        // The drawing is whole on the canvas, which is what "nobody singled out"
        // looks like — so settling on that afterwards has nothing to repaint.
        animating.current = false;
        shown.current = null;
        setStatus("finished");
        setCurrentAuthorId(null);
        return;
      }
      frame.current = requestAnimationFrame(step);
    };

    animating.current = true;
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [strokes, runs, size, playToken, getContext, paintRange, paintBackdrop]);

  // Singling a player out. Only reachable once the animation is over, so it
  // never fights the loop over the same canvas.
  useEffect(() => {
    if (status !== "finished" || animating.current || !size) return;
    if (shown.current === isolatedPlayerId) return;
    const ctx = getContext();
    if (!ctx) return;

    shown.current = isolatedPlayerId;
    ctx.clearRect(0, 0, size.width, size.height);
    paintBackdrop(ctx);
    if (isolatedPlayerId === null) {
      paintRange(ctx, 0, strokes.length, 1);
      return;
    }

    // The others go down first: whoever was singled out is then drawn over the
    // top of them rather than under.
    for (const run of runs) {
      if (run.playerId !== isolatedPlayerId) {
        paintRange(ctx, run.start, run.end, DIMMED_ALPHA);
      }
    }
    for (const run of runs) {
      if (run.playerId === isolatedPlayerId) {
        paintRange(ctx, run.start, run.end, 1);
      }
    }
  }, [
    isolatedPlayerId,
    status,
    size,
    strokes,
    runs,
    getContext,
    paintRange,
    paintBackdrop,
  ]);

  const replay = useCallback(() => {
    animateNext.current = true;
    setPlayToken((token) => token + 1);
  }, []);

  return { canvasRef, containerRef, status, currentAuthorId, replay };
};
