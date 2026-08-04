import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { GameMode } from "../../store/gameState";
import { GAME_MODES } from "../../lib/gameModes";

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
      className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5"
      data-testid="game-mode-carousel"
    >
      <div className="flex gap-3">
        <div className="rounded-xl bg-ink-primary/10 p-2 text-ink-primary h-fit">
          {currentMode.icon}
        </div>
        <div className="w-full">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            {t("options.gameMode.title")}
          </h3>
          <div className="mt-1 grid">
            {GAME_MODES.map((mode, index) => {
              const isSelected = index === currentIndex;

              return (
                <p
                  key={mode.id}
                  aria-hidden={!isSelected}
                  className={`col-start-1 row-start-1 text-sm text-stone-400 ${
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
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-900/30 px-2.5 py-1 text-xs font-semibold text-amber-400"
                data-testid="in-person-badge"
              >
                <Users className="size-3.5" />
                {t("options.gameMode.inPerson")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kept outside the icon column so both arrows sit flush with the edges
          of the card. */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={!isHost}
          onClick={() => goTo(currentIndex - 1)}
          aria-label={t("options.gameMode.previous")}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-stone-300 transition-colors hover:border-stone-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div
          className="min-w-0 flex-1 rounded-2xl border border-ink-primary bg-ink-primary/10 px-4 py-3 text-center"
          aria-live="polite"
          aria-label={t("options.gameMode.current")}
        >
          <p className="font-bold text-white">{t(currentMode.nameKey)}</p>
        </div>

        <button
          type="button"
          disabled={!isHost}
          onClick={() => goTo(currentIndex + 1)}
          aria-label={t("options.gameMode.next")}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-stone-300 transition-colors hover:border-stone-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <ChevronRight className="size-5" />
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
              className={`h-2 rounded-full transition-all disabled:cursor-default ${
                isSelected
                  ? "w-6 bg-ink-primary"
                  : "w-2 bg-stone-600 hover:bg-stone-500"
              } ${isHost ? "cursor-pointer" : ""}`}
            />
          );
        })}
      </div>
    </section>
  );
};
