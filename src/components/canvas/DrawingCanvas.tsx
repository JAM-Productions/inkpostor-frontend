import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

interface DrawingCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isMyTurn: boolean;
  isOutOfInk: boolean;
  onStartDrawing: (e: React.MouseEvent | React.TouchEvent) => void;
  /** Remaining turn time in milliseconds. */
  timeLeft: number;
}

/**
 * The shared drawing surface. Renders the `<canvas>` element, the large
 * "Out of ink" overlay shown to the active player when their ink runs out, and
 * the floating countdown shown over the canvas on small screens.
 *
 * All drawing state/handlers are owned by the {@link useCanvasDrawing} hook and
 * passed in as props.
 */
export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  canvasRef,
  containerRef,
  isMyTurn,
  isOutOfInk,
  onStartDrawing,
  timeLeft,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative group">
      <div
        ref={containerRef}
        className="w-full h-[70vh] sm:aspect-video sm:h-auto bg-[#E9DEB9] rounded-2xl overflow-hidden shadow-2xl relative"
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-red-500 animate-zoom-in text-4xl md:text-6xl uppercase drop-shadow-lg font-rubik-wet-paint font-extralight">
              {t("canvas.outOfInk")}
            </span>
          </div>
        )}
      </div>

      {/* Mobile Time indicator (floats over canvas on small screens) */}
      <div
        className={`absolute top-2.5 right-2.5 bg-stone-900/80 backdrop-blur-md rounded-xl p-2 border border-stone-700 shadow-xl pointer-events-none flex items-center gap-2 ${isMyTurn ? "sm:hidden" : "hidden"}`}
      >
        <Clock className="size-4 text-emerald-400" />
        <span className="text-xl font-black text-white tabular-nums text-right min-w-[44px]">
          {(timeLeft / 1000).toFixed(1)}
        </span>
      </div>
    </div>
  );
};
