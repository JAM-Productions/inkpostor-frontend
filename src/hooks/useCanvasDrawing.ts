import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useGameStore } from "../store/gameState";
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

  const canvasStrokes = useGameStore((state) => state.canvasStrokes);
  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const players = useGameStore((state) => state.players);
  const actions = useGameStore((state) => state.actions);
  const gameOptions = useGameStore((state) => state.gameOptions);
  const hasUnlimitedInk = gameOptions.unlimitedInk;

  const isMyTurn = currentTurnPlayerId === myId;
  // With the palette disabled the picked color is ignored in favour of the one
  // that identifies this player everywhere else in the UI. The picked color is
  // kept around so it comes back if the host turns the palette on again.
  const effectiveColor = gameOptions.playerColorsEnabled
    ? getPlayerCanvasColor(myId, hostId, players)
    : color;

  // Resize canvas to match CSS layout
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }, []);

  // Reset the ink supply whenever a new turn of mine starts
  useEffect(() => {
    if (currentTurnPlayerId && isMyTurn) {
      setInkUsed(0);
      inkCosts.current = [];
    }
  }, [currentTurnPlayerId, isMyTurn]);

  // Redraw all strokes whenever they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;

    let currentPathStart: null | { x: number; y: number } = null;

    canvasStrokes.forEach((stroke) => {
      if (stroke.isNewStroke || !currentPathStart) {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.moveTo(stroke.x, stroke.y);
        ctx.lineTo(stroke.x, stroke.y);
        ctx.stroke();
        currentPathStart = { x: stroke.x, y: stroke.y };
      } else {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.moveTo(currentPathStart.x, currentPathStart.y);
        ctx.lineTo(stroke.x, stroke.y);
        ctx.stroke();
        currentPathStart = { x: stroke.x, y: stroke.y };
      }
    });
  }, [canvasStrokes]);

  const getCoordinates = (
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

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
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMyTurn || (!hasUnlimitedInk && inkUsed >= MAX_INK)) return;
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    lastPoint.current = { x, y };

    if (hasUnlimitedInk) {
      inkCosts.current.push(0);
    } else if (inkUsed + DOT_INK_COST >= MAX_INK) {
      const addedCost = MAX_INK - inkUsed;
      setInkUsed(MAX_INK);
      inkCosts.current.push(addedCost);
    } else {
      setInkUsed((prev) => prev + DOT_INK_COST);
      inkCosts.current.push(DOT_INK_COST);
    }

    actions.drawStroke({ x, y, color: effectiveColor, isNewStroke: true });
  };

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

      if (!hasUnlimitedInk && inkUsed + distance > MAX_INK) {
        const allowedDistance = MAX_INK - inkUsed;
        inkCosts.current[inkCosts.current.length - 1] += allowedDistance;
        setInkUsed(MAX_INK);
        setIsDrawing(false);
        lastPoint.current = null;
        return;
      }

      if (!hasUnlimitedInk) {
        setInkUsed((prev) => prev + distance);
        inkCosts.current[inkCosts.current.length - 1] += distance;
      }
      lastPoint.current = { x, y };

      actions.drawStroke({ x, y, color: effectiveColor, isNewStroke: false });
    },
    [isDrawing, isMyTurn, inkUsed, hasUnlimitedInk, effectiveColor, actions],
  );

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const undoLastStroke = () => {
    if (inkCosts.current.length > 0) {
      const restoredInk = inkCosts.current.pop() || 0;
      setInkUsed((prev) => Math.max(0, prev - restoredInk));
      actions.undoStroke();
    }
  };

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
