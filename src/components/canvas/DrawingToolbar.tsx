import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, Minimize2 } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import { CANVAS_COLORS } from "../../lib/canvasColors";
import { UndoButton } from "./UndoButton";

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
const DrawingToolbarComponent: React.FC<DrawingToolbarProps> = ({
  color,
  onColorChange,
  onUndo,
  inkPercentage,
  isOutOfInk,
}) => {
  const { t } = useTranslation();
  const isMobile = useGameStore((state) => state.isMobile);
  // Field selectors: the toolbar re-renders on every ink change already, and
  // must not also wake up for an unrelated option.
  const hasUnlimitedInk = useGameStore(
    (state) => state.gameOptions.unlimitedInk,
  );
  const hasPalette = useGameStore(
    (state) => !state.gameOptions.playerColorsEnabled,
  );

  const [isCompressed, setIsCompressed] = useState(false);

  const isUndoOnly = !hasPalette && hasUnlimitedInk;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-ink-surface p-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 border-stone-950 shadow-[6px_6px_0px_#0c0b09] flex flex-col gap-4 animate-pop-in z-50 transition-[max-width,width] duration-300 ${
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
            className={`flex flex-1 min-w-0 gap-1.5 p-1 bg-[#181512] rounded-[16px_5px_18px_5px] border-2 border-stone-950 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)] ${isMobile ? "overflow-x-auto no-scrollbar" : "overflow-x-auto custom-scrollbar pb-2"}`}
          >
            {CANVAS_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => onColorChange(c)}
                aria-label={t(`canvas.colors.${c}`)}
                className={`size-9 sm:size-10 shrink-0 rounded-full transition-transform border-3 ${color === c ? "scale-110 border-amber-300 shadow-[2px_2px_0px_#000]" : "scale-90 opacity-80 hover:opacity-100 border-stone-950"} cursor-pointer active:scale-95`}
                style={{
                  backgroundColor: c,
                }}
              />
            ))}
          </div>

          <div className="w-0.5 h-8 shrink-0 bg-stone-700 mt-1.5" />

          <div className="flex gap-2 mt-0.5">
            <UndoButton onUndo={onUndo} showLabel={isUndoOnly} />

            {!hasUnlimitedInk && (
              <button
                type="button"
                onClick={() => setIsCompressed(true)}
                className="mt-0.5 size-10 rounded-[14px_4px_16px_4px] border-2 border-stone-950 shrink-0 cursor-pointer bg-[#181512] flex items-center justify-center text-amber-200 hover:bg-stone-800 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]"
                title={t("canvas.compress")}
                aria-label="Compress toolbar"
              >
                <Minimize2 className="size-5 text-amber-300" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ink Meter & Compressed Mode Controls */}
      <div className="flex items-center gap-4">
        {!hasUnlimitedInk && (
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-sm font-handwritten font-bold uppercase tracking-widest px-1">
              <span
                className={isOutOfInk ? "text-red-400" : "text-amber-200/80"}
              >
                {t("canvas.inkSupply")}
              </span>
              <span
                className={
                  isOutOfInk
                    ? "text-red-400 animate-pulse font-extrabold"
                    : "text-emerald-400"
                }
              >
                {isOutOfInk
                  ? t("canvas.outOfInk")
                  : `${Math.floor(100 - inkPercentage)}%`}
              </span>
            </div>
            <div className="h-4 bg-[#181512] rounded-full overflow-hidden border-2 border-stone-950 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]">
              <div
                className={`h-full transition-[width,background-color] duration-100 ease-out ${isOutOfInk ? "bg-red-500" : "bg-linear-to-r from-emerald-400 to-amber-300"}`}
                style={{ width: `${inkPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Without a palette this is the only place the undo button lives */}
        {!hasPalette && (
          <div className="flex shrink-0">
            <UndoButton onUndo={onUndo} showLabel={isUndoOnly} />
          </div>
        )}

        {hasPalette && isCompressed && (
          <div className="flex gap-2 shrink-0">
            <UndoButton onUndo={onUndo} showLabel={isUndoOnly} />

            <button
              type="button"
              onClick={() => setIsCompressed(false)}
              className="size-10 rounded-[14px_4px_16px_4px] border-2 border-stone-950 cursor-pointer bg-[#181512] flex items-center justify-center text-amber-200 hover:bg-stone-800 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]"
              title={t("canvas.expand")}
              aria-label="Expand toolbar"
            >
              <Maximize2 className="size-5 text-amber-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const DrawingToolbar = React.memo(DrawingToolbarComponent);
DrawingToolbar.displayName = "DrawingToolbar";
