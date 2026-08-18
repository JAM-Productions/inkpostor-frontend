import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useGameStore, type StrokeData } from "../store/gameState";
import { MAX_INK, DOT_INK_COST } from "../lib/constants";
import { DEFAULT_CANVAS_COLOR } from "../lib/canvasColors";
import { getPlayerCanvasColor } from "../lib/playerColors";

export interface UseCanvasDrawing {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  color: string;
  setColor: React.Dispatch<React.SetStateAction<string>>;
  isDrawing: boolean;
  startDrawing: (e: React.MouseEvent | React.TouchEvent) => void;
  stopDrawing: () => void;
  undoLastStroke: () => void;
  inkPercentage: number;
  isOutOfInk: boolean;
}

/**
 * Encapsulates the shared drawing-canvas logic: pointer handling, ink
 * accounting, stroke rendering, canvas sizing and the global listeners that
 * keep a stroke going even when the pointer leaves the canvas.
 *
 * The hook owns the canvas/container refs so the consuming component only needs
 * to attach them to the DOM and wire `startDrawing` to the pointer-down events.
 */
export const useCanvasDrawing = (): UseCanvasDrawing => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const inkCosts = useRef<number[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [inkUsed, setInkUsed] = useState(0);
  const [color, setColor] = useState(DEFAULT_CANVAS_COLOR);

  // The ink total is mirrored in a ref so the pointer handlers can read it
  // without listing it as a dependency. That keeps their identity stable across
  // a stroke, which is what lets the memoized children skip the re-render.
  const inkUsedRef = useRef(0);
  const setInk = useCallback((next: number) => {
    inkUsedRef.current = next;
    setInkUsed(next);
  }, []);

  const canvasStrokes = useGameStore((state) => state.canvasStrokes);
  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const players = useGameStore((state) => state.players);
  const actions = useGameStore((state) => state.actions);
  // Field selectors rather than the whole options object: this hook runs on the
  // hot path and must not wake up for an unrelated option change.
  const hasUnlimitedInk = useGameStore(
    (state) => state.gameOptions.unlimitedInk,
  );
  const playerColorsEnabled = useGameStore(
    (state) => state.gameOptions.playerColorsEnabled,
  );

  const isMyTurn = currentTurnPlayerId === myId;
  // With the palette disabled the picked color is ignored in favour of the one
  // that identifies this player everywhere else in the UI. The picked color is
  // kept around so it comes back if the host turns the palette on again.
  const effectiveColor = playerColorsEnabled
    ? getPlayerCanvasColor(myId, hostId, players)
    : color;

  // How much of `canvasStrokes` is already on the canvas, and the stroke that
  // sits at that boundary. Together they answer the only question the painter
  // needs: is the new array a continuation of what we drew, or something else?
  const paintedCount = useRef(0);
  const paintedTail = useRef<StrokeData | null>(null);
  // Where the pen currently rests, so an appended point knows what to join to.
  const penPoint = useRef<{ x: number; y: number } | null>(null);
  // Bumped when the canvas buffer is cleared out from under us by a resize.
  const [repaintToken, setRepaintToken] = useState(0);

  // Keep the canvas buffer the size of its CSS box. Resizing the buffer wipes
  // it, so every resize also forces a full repaint.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const applySize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;
      paintedCount.current = 0;
      paintedTail.current = null;
      penPoint.current = null;
      setRepaintToken((token) => token + 1);
    };

    applySize();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(applySize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Reset the ink supply whenever a new turn of mine starts
  useEffect(() => {
    if (currentTurnPlayerId && isMyTurn) {
      setInk(0);
      inkCosts.current = [];
    }
  }, [currentTurnPlayerId, isMyTurn, setInk]);

  // Paint the strokes that are not on the canvas yet.
  //
  // While a turn runs the array only ever grows, so the common case is drawing
  // the handful of points that arrived since the last render. Redrawing the
  // whole array on every point is what made a long turn quadratic: at 4.000
  // points it cost ~772ms of canvas work spread over the turn, against well
  // under a millisecond this way.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;

    // An undo, a new round or a fresh array off a state update all mean what is
    // on screen is no longer a prefix of the truth, so the canvas is rebuilt.
    const painted = paintedCount.current;
    const isAppend =
      canvasStrokes.length >= painted &&
      (painted === 0 || canvasStrokes[painted - 1] === paintedTail.current);

    let from = painted;
    if (!isAppend) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      penPoint.current = null;
      from = 0;
    }

    for (let i = from; i < canvasStrokes.length; i++) {
      const stroke = canvasStrokes[i];
      const pen = stroke.isNewStroke ? null : penPoint.current;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      if (pen) {
        ctx.moveTo(pen.x, pen.y);
      } else {
        ctx.moveTo(stroke.x, stroke.y);
      }
      ctx.lineTo(stroke.x, stroke.y);
      ctx.stroke();

      penPoint.current = { x: stroke.x, y: stroke.y };
    }

    paintedCount.current = canvasStrokes.length;
    paintedTail.current = canvasStrokes[canvasStrokes.length - 1] ?? null;
  }, [canvasStrokes, repaintToken]);

  // The canvas box only moves on a resize or a scroll, but reading it back per
  // pointer event forces the browser to recompute layout every time. It is
  // measured once per stroke instead, and dropped when the page moves.
  const canvasRect = useRef<DOMRect | null>(null);

  useEffect(() => {
    const invalidate = () => {
      canvasRect.current = null;
    };
    window.addEventListener("resize", invalidate);
    window.addEventListener("scroll", invalidate, true);
    return () => {
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("scroll", invalidate, true);
    };
  }, []);

  const getCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      if (!canvasRect.current) {
        canvasRect.current = canvas.getBoundingClientRect();
      }
      const rect = canvasRect.current;

      // Scale the coordinates based on actual dimension vs CSS dimension
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX, clientY;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const used = inkUsedRef.current;
      if (!isMyTurn || (!hasUnlimitedInk && used >= MAX_INK)) return;
      e.preventDefault();
      setIsDrawing(true);
      // A stroke is the one moment the box is worth re-measuring: the layout may
      // have shifted since the last one without firing resize or scroll.
      canvasRect.current = null;
      const { x, y } = getCoordinates(e);
      lastPoint.current = { x, y };

      if (hasUnlimitedInk) {
        inkCosts.current.push(0);
      } else if (used + DOT_INK_COST >= MAX_INK) {
        setInk(MAX_INK);
        inkCosts.current.push(MAX_INK - used);
      } else {
        setInk(used + DOT_INK_COST);
        inkCosts.current.push(DOT_INK_COST);
      }

      actions.drawStroke({ x, y, color: effectiveColor, isNewStroke: true });
    },
    [
      isMyTurn,
      hasUnlimitedInk,
      effectiveColor,
      actions,
      getCoordinates,
      setInk,
    ],
  );

  // Pointer moves arrive at whatever rate the panel runs at — up to 120 or 240
  // times a second on a modern phone — and each one used to be its own socket
  // message and its own store update. They are collected here and sent once per
  // frame instead, as one message the server forwards whole.
  const pendingPoints = useRef<StrokeData[]>([]);
  const flushHandle = useRef<number | null>(null);

  const flushPoints = useCallback(() => {
    flushHandle.current = null;
    const points = pendingPoints.current;
    pendingPoints.current = [];
    // The ink meter catches up with the frame rather than with every event.
    setInkUsed(inkUsedRef.current);
    if (points.length === 0) return;
    actions.drawStroke(points);
  }, [actions]);

  const queuePoint = useCallback(
    (point: StrokeData) => {
      pendingPoints.current.push(point);
      if (flushHandle.current !== null) return;
      if (typeof requestAnimationFrame === "undefined") {
        flushPoints();
        return;
      }
      flushHandle.current = requestAnimationFrame(flushPoints);
    },
    [flushPoints],
  );

  useEffect(
    () => () => {
      if (flushHandle.current !== null) {
        cancelAnimationFrame(flushHandle.current);
      }
    },
    [],
  );

  const draw = useCallback(
    (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !isMyTurn || !lastPoint.current) return;
      e.preventDefault();

      const { x, y } = getCoordinates(e);

      // Calculate distance for ink
      const distance = Math.sqrt(
        Math.pow(x - lastPoint.current.x, 2) +
          Math.pow(y - lastPoint.current.y, 2),
      );

      const used = inkUsedRef.current;

      // The cut-off stays exact and immediate — it reads the ref, not the
      // state — so running dry still stops the stroke on the very event that
      // exhausts it, whatever the frame is doing.
      if (!hasUnlimitedInk && used + distance > MAX_INK) {
        inkCosts.current[inkCosts.current.length - 1] += MAX_INK - used;
        setInk(MAX_INK);
        setIsDrawing(false);
        lastPoint.current = null;
        return;
      }

      if (!hasUnlimitedInk) {
        inkUsedRef.current = used + distance;
        inkCosts.current[inkCosts.current.length - 1] += distance;
      }
      lastPoint.current = { x, y };

      queuePoint({ x, y, color: effectiveColor, isNewStroke: false });
    },
    [
      isDrawing,
      isMyTurn,
      hasUnlimitedInk,
      effectiveColor,
      getCoordinates,
      setInk,
      queuePoint,
    ],
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPoint.current = null;
    // Send the tail of the stroke now rather than waiting on a frame that may
    // not come for a while once the finger is off the screen.
    if (flushHandle.current !== null) {
      cancelAnimationFrame(flushHandle.current);
    }
    flushPoints();
  }, [flushPoints]);

  const undoLastStroke = useCallback(() => {
    if (inkCosts.current.length > 0) {
      const restoredInk = inkCosts.current.pop() || 0;
      setInk(Math.max(0, inkUsedRef.current - restoredInk));
      actions.undoStroke();
    }
  }, [actions, setInk]);

  // Attach global listeners for draw to prevent "sticking" if mouse leaves canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => stopDrawing();
    const handleGlobalMouseMove = (e: MouseEvent) => isDrawing && draw(e);
    const handleGlobalTouchMove = (e: TouchEvent) => isDrawing && draw(e);

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("touchend", handleGlobalMouseUp);

    // Only attach move to document if we are drawing, to capture outside movements
    if (isDrawing) {
      document.addEventListener("mousemove", handleGlobalMouseMove, {
        passive: false,
      });
      document.addEventListener("touchmove", handleGlobalTouchMove, {
        passive: false,
      });
    }

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchend", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("touchmove", handleGlobalTouchMove);
    };
  }, [isDrawing, draw]);

  const inkPercentage = Math.min((inkUsed / MAX_INK) * 100, 100);
  const isOutOfInk = !hasUnlimitedInk && inkPercentage >= 100;

  return {
    canvasRef,
    containerRef,
    color: effectiveColor,
    setColor,
    isDrawing,
    startDrawing,
    stopDrawing,
    undoLastStroke,
    inkPercentage,
    isOutOfInk,
  };
};
