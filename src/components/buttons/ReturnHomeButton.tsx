import { Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../../store/gameState";

/**
 * The way out once a game is over. It lives in the topbar, where it is the only
 * control left at that point — the room code and the host's End Game are gone —
 * so it can afford to spell itself out at every size.
 */
export function ReturnHomeButton() {
  const { t } = useTranslation();
  const phase = useGameStore((state) => state.phase);
  const gameEnded = useGameStore((state) => state.gameEnded);
  const roomId = useGameStore((state) => state.roomId);
  const myName = useGameStore((state) => state.myName);
  const actions = useGameStore((state) => state.actions);

  if (!roomId || !myName || phase !== "RESULTS" || !gameEnded) {
    return null;
  }

  return (
    <button
      type="button"
      data-testid="return-home-button"
      onClick={actions.exitGame}
      className="flex items-center justify-center gap-2 rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-ink-surface px-3.5 py-1.5 font-handwritten text-base font-bold text-amber-200 shadow-[3px_3px_0px_#0c0b09] transition-colors cursor-pointer hover:-rotate-1 hover:bg-stone-800 hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09]"
    >
      <Home className="size-4 shrink-0 text-amber-400" />
      {t("result.returnToHome")}
    </button>
  );
}
