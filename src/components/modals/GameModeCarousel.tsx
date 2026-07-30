import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Dices, PartyPopper } from "lucide-react";
import { useGameStore, type GameMode } from "../../store/gameState";

interface GameModeDefinition {
  id: GameMode;
  nameKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
}

const GAME_MODES: GameModeDefinition[] = [
  {
    id: "CLASSIC",
    nameKey: "options.gameMode.classic.name",
    descriptionKey: "options.gameMode.classic.description",
    icon: <Dices className="size-5" />,
  },
  {
    id: "CUSTOM_WORD",
    nameKey: "options.gameMode.customWord.name",
    descriptionKey: "options.gameMode.customWord.description",
    icon: <PartyPopper className="size-5" />,
  },
];

interface GameModeCarouselProps {
  isHost: boolean;
}

// Unlike the rest of the options, the selected mode is sent to the server as
// soon as it changes: the carousel has no confirm step.
export const GameModeCarousel: React.FC<GameModeCarouselProps> = ({
  isHost,
}) => {
  const { t } = useTranslation();
  const gameMode = useGameStore((state) => state.gameMode);
  const actions = useGameStore((state) => state.actions);

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
    actions.setGameMode(nextMode.id);
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
          {/* Every description is stacked in the same grid cell so the block is
              always as tall as the longest one: switching modes (or languages)
              can't shift the layout below it. */}
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
