import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, Minimize2, Undo } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import { CANVAS_COLORS } from "../../lib/canvasColors";

interface DrawingToolbarProps {
  color: string;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  /** Percentage of ink already used (0-100). */
  inkPercentage: number;
  isOutOfInk: boolean;
}

/**
 * Floating toolbar shown to the active player. Holds the color palette, the
 * undo button, the compress/expand toggle and the ink-supply meter. The
 * compressed state is purely local UI state.
 *
 * With the player-colors option on there is no palette to show, so the toolbar
 * shrinks to the undo button plus the ink meter (or just undo when ink is
 * unlimited) and the compress toggle goes away with it.
 */
export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  color,
  onColorChange,
  onUndo,
  inkPercentage,
  isOutOfInk,
}) => {
  const { t } = useTranslation();
  const isMobile = useGameStore((state) => state.isMobile);
  const gameOptions = useGameStore((state) => state.gameOptions);
  const hasUnlimitedInk = gameOptions.unlimitedInk;
  const hasPalette = !gameOptions.playerColorsEnabled;

  const [isCompressed, setIsCompressed] = useState(false);

  const isUndoOnly = !hasPalette && hasUnlimitedInk;

  const undoButton = (
    <button
      type="button"
      data-testid="undo-stroke-btn"
      onClick={onUndo}
      className={`rounded-xl shrink-0 cursor-pointer bg-stone-700 flex items-center justify-center gap-2 text-stone-300 hover:bg-stone-600 transition-colors active:scale-95 ${isUndoOnly ? "h-10 px-4" : "size-10"}`}
      title={t("canvas.undo")}
      aria-label="Undo last stroke"
    >
      <Undo className="size-5" />
      {isUndoOnly && (
        <span className="text-sm font-bold uppercase tracking-wider">
          {t("canvas.undo")}
        </span>
      )}
    </button>
  );

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-stone-800/95 backdrop-blur-xl p-4 rounded-3xl border border-stone-700 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-10 z-50 transition-all duration-300 ${
        hasPalette
          ? `w-[calc(100%-2rem)] ${isCompressed ? "max-w-sm" : "max-w-3xl"}`
          : hasUnlimitedInk
            ? "w-fit"
            : "w-[calc(100%-2rem)] max-w-sm"
      }`}
    >
      {/* Color Palette & Controls */}
      {hasPalette && !isCompressed && (
        <div className="flex gap-3 w-full">
          <div
            className={`flex flex-1 min-w-0 gap-1 p-0.5 ${isMobile ? "overflow-x-auto no-scrollbar" : "overflow-x-auto custom-scrollbar pb-3"}`}
          >
            {CANVAS_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => onColorChange(c)}
                aria-label={t(`canvas.colors.${c}`)}
                className={`size-10 shrink-0 rounded-full transition-transform border-[3px] ${color === c ? "scale-105 shadow-lg" : "scale-90 opacity-80 hover:opacity-100"} cursor-pointer active:scale-95`}
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "white" : "transparent",
                }}
              />
            ))}
          </div>

          <div className="w-px h-8 shrink-0 bg-stone-700 mt-1.5" />

          <div className="flex gap-2 mt-0.5">
            {undoButton}

            {!hasUnlimitedInk && (
              <button
                type="button"
                onClick={() => setIsCompressed(true)}
                className="mt-0.5 size-10 rounded-xl shrink-0 cursor-pointer bg-stone-700 flex items-center justify-center text-stone-300 hover:bg-stone-600 transition-colors active:scale-95"
                title={t("canvas.compress")}
                aria-label="Compress toolbar"
              >
                <Minimize2 className="size-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ink Meter & Compressed Mode Controls */}
      <div className="flex items-center gap-4">
        {!hasUnlimitedInk && (
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
              <span className={isOutOfInk ? "text-red-400" : "text-stone-400"}>
                {t("canvas.inkSupply")}
              </span>
              <span
                className={
                  isOutOfInk ? "text-red-400 animate-pulse" : "text-emerald-400"
                }
              >
                {isOutOfInk
                  ? t("canvas.outOfInk")
                  : `${Math.floor(100 - inkPercentage)}%`}
              </span>
            </div>
            <div className="h-4 bg-stone-900 rounded-full overflow-hidden border border-stone-700 shadow-inner">
              <div
                className={`h-full transition-all duration-100 ease-out ${isOutOfInk ? "bg-red-500" : "bg-linear-to-r from-emerald-400 to-teal-400"}`}
                style={{ width: `${inkPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Without a palette this is the only place the undo button lives */}
        {!hasPalette && <div className="flex shrink-0">{undoButton}</div>}

        {hasPalette && isCompressed && (
          <div className="flex gap-2 shrink-0">
            {undoButton}

            <button
              type="button"
              onClick={() => setIsCompressed(false)}
              className="size-10 rounded-xl cursor-pointer bg-stone-700 flex items-center justify-center text-stone-300 hover:bg-stone-600 transition-colors active:scale-95"
              title={t("canvas.expand")}
              aria-label="Expand toolbar"
            >
              <Maximize2 className="size-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
