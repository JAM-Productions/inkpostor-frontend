import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CanvasRoundSelectorProps {
  /** The rounds present in the drawing, oldest first. `null` is an unstamped one. */
  rounds: (number | null)[];
  selectedRound: number | null;
  onSelect: (round: number | null) => void;
}

/**
 * Picks which round of the drawing to replay.
 *
 * A carousel rather than one card per round: a long game keeps adding rounds,
 * and a row of them would outgrow the modal. Built like the game mode carousel
 * in the options, down to the dots.
 *
 * Only shown when a drawing holds more than one round, which is what a canvas
 * the host chose to keep between them looks like.
 */
export const CanvasRoundSelector: React.FC<CanvasRoundSelectorProps> = ({
  rounds,
  selectedRound,
  onSelect,
}) => {
  const { t } = useTranslation();

  const currentIndex = Math.max(
    rounds.findIndex((round) => round === selectedRound),
    0,
  );

  const label = (round: number | null) =>
    round === null
      ? t("canvasPreview.earlierRound")
      : t("canvasPreview.round", { round });

  const goTo = (index: number) => {
    // Wrap around so the carousel is endless in both directions
    const wrappedIndex = (index + rounds.length) % rounds.length;
    if (wrappedIndex === currentIndex) return;
    onSelect(rounds[wrappedIndex]);
  };

  return (
    <div data-testid="canvas-round-selector" className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goTo(currentIndex - 1)}
          aria-label={t("canvasPreview.previousRound")}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-ink-surface text-amber-300 shadow-[2px_2px_0px_#000] transition-transform hover:-rotate-6 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]"
        >
          <ChevronLeft className="size-5 stroke-3" />
        </button>

        <div
          className="min-w-0 flex-1 rounded-[16px_5px_18px_6px] border-2 border-stone-950 bg-amber-400/15 px-4 py-2 text-center shadow-[2px_2px_0px_#000]"
          aria-live="polite"
        >
          <p
            data-testid="canvas-round-current"
            className="truncate font-handwritten text-lg font-extrabold tracking-wide text-white uppercase"
          >
            {label(rounds[currentIndex])}
          </p>
        </div>

        <button
          type="button"
          onClick={() => goTo(currentIndex + 1)}
          aria-label={t("canvasPreview.nextRound")}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-ink-surface text-amber-300 shadow-[2px_2px_0px_#000] transition-transform hover:rotate-6 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]"
        >
          <ChevronRight className="size-5 stroke-3" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {rounds.map((round, index) => {
          const isSelected = index === currentIndex;

          return (
            <button
              key={round ?? "unknown"}
              type="button"
              data-testid={`preview-round-${round ?? "unknown"}`}
              onClick={() => goTo(index)}
              aria-label={t("canvasPreview.selectRound", {
                round: label(round),
              })}
              aria-current={isSelected}
              className={`h-2.5 cursor-pointer rounded-full border border-stone-950 transition-colors ${
                isSelected
                  ? "w-6 bg-amber-400 shadow-[1px_1px_0px_#000]"
                  : "w-2.5 bg-stone-700 hover:bg-stone-600"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
