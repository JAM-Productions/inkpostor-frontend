import React from "react";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { TurnCountdown } from "./TurnCountdown";

interface DrawingCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isMyTurn: boolean;
  isOutOfInk: boolean;
  onStartDrawing: (e: React.MouseEvent | React.TouchEvent) => void;
}

/**
 * The shared drawing surface. Renders the `<canvas>` element, the large
 * "Out of ink" overlay shown to the active player when their ink runs out, and
 * the floating countdown shown over the canvas on small screens.
 *
 * All drawing state/handlers are owned by the {@link useCanvasDrawing} hook and
 * passed in as props.
 */
const DrawingCanvasComponent: React.FC<DrawingCanvasProps> = ({
  canvasRef,
  containerRef,
  isMyTurn,
  isOutOfInk,
  onStartDrawing,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative group">
      <div
        ref={containerRef}
        className="w-full h-[70vh] sm:aspect-video sm:h-auto bg-[#F4ECD8] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] overflow-hidden border-4 border-stone-950 shadow-[8px_8px_0px_#0c0b09] relative"
      >
        <canvas
          ref={canvasRef}
          className={`w-full h-full touch-none ${
            isMyTurn && !isOutOfInk ? "cursor-crosshair" : "cursor-not-allowed"
          }`}
          onMouseDown={onStartDrawing}
          onTouchStart={onStartDrawing}
        />

        {isMyTurn && isOutOfInk && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/40 backdrop-blur-xs">
            <span className="text-red-500 animate-zoom-in text-4xl md:text-6xl uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] font-rubik-wet-paint">
              {t("canvas.outOfInk")}
            </span>
          </div>
        )}
      </div>

      {/* Mobile Time indicator (floats over canvas on small screens) */}
      <div
        className={`absolute top-3 right-3 bg-ink-surface rounded-[14px_4px_16px_4px] p-2 border-2 border-stone-950 shadow-[3px_3px_0px_#0c0b09] pointer-events-none flex items-center gap-2 ${isMyTurn ? "sm:hidden" : "hidden"}`}
      >
        <Clock className="size-4 text-amber-400" />
        <span className="text-xl font-short-stack font-black text-white tabular-nums text-right min-w-11">
          <TurnCountdown />
        </span>
      </div>
    </div>
  );
};

export const DrawingCanvas = React.memo(DrawingCanvasComponent);
DrawingCanvas.displayName = "DrawingCanvas";
