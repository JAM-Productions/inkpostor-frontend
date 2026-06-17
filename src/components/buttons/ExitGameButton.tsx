import { LogOut } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import { useModalStore } from "../../store/modalStore";
import { useTranslation } from "react-i18next";

export function ExitGameButton() {
  const { t } = useTranslation();
  const roomId = useGameStore((state) => state.roomId);
  const myName = useGameStore((state) => state.myName);
  const gameEnded = useGameStore((state) => state.gameEnded);
  const modalActions = useModalStore((state) => state.actions);

  if (!roomId || !myName || gameEnded) {
    return null;
  }

  return (
    <button
      type="button"
      data-testid="exit-game-button"
      className="fixed top-4 left-4 p-2 sm:p-2.5 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white transition-all cursor-pointer shadow-lg active:scale-95 z-50 flex items-center justify-center"
      onClick={() => modalActions.openModal("EXIT_GAME")}
      aria-label={t("exitGame.open")}
    >
      <LogOut className="size-3 sm:size-3.5 text-red-500" />
    </button>
  );
}
