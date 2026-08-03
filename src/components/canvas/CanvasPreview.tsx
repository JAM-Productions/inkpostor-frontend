import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import { getFitTransform, renderStrokes } from "../../lib/canvasRender";
import type { StrokeData } from "../../store/gameState";

/** Empty space kept between the drawing and the edges of the preview box. */
const PREVIEW_PADDING = 12;

/** Stable fallback so the render effect doesn't rerun on every render. */
const NO_STROKES: StrokeData[] = [];

/**
 * Mirrors the shape of the drawing surface on this device (see
 * {@link DrawingCanvas}, `h-[70vh]` on phones and `sm:aspect-video` above the
 * `sm` breakpoint) so the preview reads like the canvas the player drew on:
 * portrait and narrow on mobile, widescreen on desktop.
 */
const DEVICE_SHAPED_BOX = "aspect-[2/3] sm:aspect-video";

interface CanvasPreviewProps {
  /**
   * Extra classes for the outer wrapper. The portrait mobile box grows with the
   * available width, so callers cap it with a `max-w-[Nvh]` sized against the
   * room they have (`sm:max-w-none` to release the cap on desktop).
   */
  className?: string;
  /** Sizing classes for the preview box. Defaults to the device shape. */
  boxClassName?: string;
  /** Hides the "The drawing" caption when the surrounding UI is tight. */
  showLabel?: boolean;
}

/**
 * Read-only miniature of the shared canvas, used after the drawing phase so
 * players can still look at what was drawn (e.g. while the impostor makes the
 * final guess).
 *
 * The strokes are scaled to fit the preview box instead of being mapped from
 * the original canvas size: coordinates come from each drawer's own canvas
 * pixel space, so fitting the drawn content is what keeps it readable here.
 */
export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  className = "",
  boxClassName = DEVICE_SHAPED_BOX,
  showLabel = true,
}) => {
  const { t } = useTranslation();
  const strokes = useGameStore((state) => state.canvasStrokes ?? NO_STROKES);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const isEmpty = strokes.length === 0;

  // Track the rendered box so the bitmap always matches its CSS size. The box
  // is shaped in viewport units, so rotating a phone reshapes it entirely.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () =>
      setSize((current) => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        return current.width === width && current.height === height
          ? current
          : { width, height };
      });

    measure();
    window.addEventListener("resize", measure);

    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(container);

    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;

    canvas.width = size.width;
    canvas.height = size.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderStrokes(
      ctx,
      strokes,
      getFitTransform(strokes, size.width, size.height, PREVIEW_PADDING),
    );
  }, [strokes, size]);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-400">
          <ImageIcon className="size-4" />
          {t("canvasPreview.title")}
        </div>
      )}
      <div
        ref={containerRef}
        data-testid="canvas-preview"
        className={`relative w-full bg-[#E9DEB9] rounded-2xl overflow-hidden border border-stone-700 shadow-lg ${boxClassName}`}
      >
        <canvas ref={canvasRef} className="w-full h-full" />

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
            <span className="text-stone-500 text-sm font-semibold">
              {t("canvasPreview.empty")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
