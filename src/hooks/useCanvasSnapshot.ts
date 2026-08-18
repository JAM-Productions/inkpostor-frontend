import React, { useEffect, useMemo, useRef } from "react";
import type { StrokeData } from "../store/gameState";
import { getFitTransform, getStrokeBounds } from "../lib/strokeGeometry";
import {
  getPreviewLineWidth,
  paintStrokes,
  STROKE_PADDING,
} from "../lib/paintStrokes";
import { useCanvasBox } from "./useCanvasBox";

export interface UseCanvasSnapshot {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Puts a finished drawing on a canvas and leaves it there.
 *
 * The still version of {@link useCanvasReplay}: no animation to start, nobody to
 * single out, no rounds to choose between. Whoever is looking at it has other
 * things to be doing — a word to guess, or a guess to wait for.
 */
export const useCanvasSnapshot = (strokes: StrokeData[]): UseCanvasSnapshot => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { containerRef, size } = useCanvasBox();

  const transform = useMemo(
    () =>
      getFitTransform(
        getStrokeBounds(strokes),
        size?.width ?? 0,
        size?.height ?? 0,
        STROKE_PADDING,
      ),
    [strokes, size],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;

    if (canvas.width !== size.width || canvas.height !== size.height) {
      canvas.width = size.width;
      canvas.height = size.height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = getPreviewLineWidth(transform.scale);

    ctx.clearRect(0, 0, size.width, size.height);
    paintStrokes(ctx, strokes, 0, strokes.length, 1, transform);
  }, [strokes, size, transform]);

  return { canvasRef, containerRef };
};
