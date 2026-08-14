import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { GameMode } from "../../../store/gameState";
import { GAME_MODES } from "../../../lib/gameModes";

interface GameModeCarouselProps {
  isHost: boolean;
  gameMode: GameMode;
  onChange: (mode: GameMode) => void;
}

// Controlled by the options modal: like every other option the mode is staged
// there and only reaches the server when the host saves.
export const GameModeCarousel: React.FC<GameModeCarouselProps> = ({
  isHost,
  gameMode,
  onChange,
}) => {
  const { t } = useTranslation();

  const currentIndex = Math.max(
    GAME_MODES.findIndex((mode) => mode.id === gameMode),
    0,
  );
  const currentMode = GAME_MODES[currentIndex];

  const goTo = (index: number) => {
    if (!isHost) return;
    // Wrap around so the carousel is endless in both directions
    const wrappedIndex = (index + GAME_MODES.length) % GAME_MODES.length;
    const nextMode = GAME_MODES[wrappedIndex];
    if (nextMode.id === gameMode) return;
    onChange(nextMode.id);
  };

  return (
    <section
      className="rounded-[18px_6px_20px_7px] border-2 border-stone-950 bg-[#181512] p-4 sm:p-5 shadow-[3px_3px_0px_#0c0b09]"
      data-testid="game-mode-carousel"
    >
      <div className="flex gap-3">
        <div className="rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-red-950/80 p-2.5 text-amber-300 h-fit shadow-[2px_2px_0px_#000]">
          {currentMode.icon}
        </div>
        <div className="w-full">
          <h3 className="text-base font-handwritten font-bold uppercase tracking-wider text-white">
            {t("options.gameMode.title")}
          </h3>
          <div className="mt-0.5 grid">
            {GAME_MODES.map((mode, index) => {
              const isSelected = index === currentIndex;

              return (
                <p
                  key={mode.id}
                  aria-hidden={!isSelected}
                  className={`col-start-1 row-start-1 text-base font-handwritten text-amber-200/70 ${
                    isSelected ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  {t(mode.descriptionKey)}
                </p>
              );
            })}
          </div>

          <div className="mt-2 min-h-7">
            {currentMode.isInPerson && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-stone-950 bg-amber-400/20 px-3 py-1 text-xs font-handwritten font-bold text-amber-300 shadow-[1px_1px_0px_#000]"
                data-testid="in-person-badge"
              >
                <Users className="size-3.5" />
                {t("options.gameMode.inPerson")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={!isHost}
          onClick={() => goTo(currentIndex - 1)}
          aria-label={t("options.gameMode.previous")}
          className="flex size-10 shrink-0 items-center justify-center rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-ink-surface text-amber-300 shadow-[2px_2px_0px_#000] transition-colors hover:-rotate-6 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:rotate-0 cursor-pointer"
        >
          <ChevronLeft className="size-6 stroke-3" />
        </button>

        <div
          className="min-w-0 flex-1 rounded-[16px_5px_18px_6px] border-2 border-stone-950 bg-amber-400/15 px-4 py-3 text-center shadow-[2px_2px_0px_#000]"
          aria-live="polite"
          aria-label={t("options.gameMode.current")}
        >
          <p className="font-handwritten text-xl font-extrabold text-white uppercase tracking-wide">
            {t(currentMode.nameKey)}
          </p>
        </div>

        <button
          type="button"
          disabled={!isHost}
          onClick={() => goTo(currentIndex + 1)}
          aria-label={t("options.gameMode.next")}
          className="flex size-10 shrink-0 items-center justify-center rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-ink-surface text-amber-300 shadow-[2px_2px_0px_#000] transition-colors hover:rotate-6 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:rotate-0 cursor-pointer"
        >
          <ChevronRight className="size-6 stroke-3" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {GAME_MODES.map((mode, index) => {
          const isSelected = index === currentIndex;

          return (
            <button
              key={mode.id}
              type="button"
              disabled={!isHost}
              onClick={() => goTo(index)}
              aria-label={t("options.gameMode.select", {
                mode: t(mode.nameKey),
              })}
              aria-current={isSelected}
              className={`h-2.5 rounded-full border border-stone-950 transition-colors disabled:cursor-default ${
                isSelected
                  ? "w-6 bg-amber-400 shadow-[1px_1px_0px_#000]"
                  : "w-2.5 bg-stone-700 hover:bg-stone-600"
              } ${isHost ? "cursor-pointer" : ""}`}
            />
          );
        })}
      </div>
    </section>
  );
};
