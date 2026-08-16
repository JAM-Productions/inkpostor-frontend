import React from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../../store/gameState";

interface GameOverActionsProps {
  isHost: boolean;
}

/**
 * What a finished game offers: only the host can take the room back to the
 * lobby, so everybody else is told who they are waiting for. The way out of the
 * room lives in the topbar (see ReturnHomeButton).
 */
export const GameOverActions: React.FC<GameOverActionsProps> = ({ isHost }) => {
  const { t } = useTranslation();
  const actions = useGameStore((state) => state.actions);

  if (!isHost) {
    return (
      <div className="animate-fade-in animate-delay-2000 animate-duration-slower">
        <div className="text-amber-200/70 font-handwritten font-bold text-lg animate-pulse mt-6">
          {t("result.waitingRestart")}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      data-testid="play-again-btn"
      onClick={actions.playAgain}
      className="w-full cursor-pointer group relative overflow-hidden rounded-[22px_7px_18px_9px] border-3 border-stone-950 transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] shadow-[4px_4px_0px_#0c0b09] bg-red-600 hover:bg-red-500 text-white animate-fade-in animate-delay-2000 animate-duration-slower"
    >
      <div className="flex h-full w-full items-center justify-center gap-2 px-8 py-3.5">
        <span className="text-2xl sm:text-3xl tracking-wider uppercase font-rubik-wet-paint">
          {t("result.playAgain")}
        </span>
      </div>
    </button>
  );
};
