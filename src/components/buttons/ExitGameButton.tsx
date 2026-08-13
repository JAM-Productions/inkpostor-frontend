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
      className="fixed top-3 left-3 sm:top-4 sm:left-4 p-2.5 rounded-[14px_4px_16px_5px] bg-[#26221d] hover:bg-stone-800 border-2 border-stone-950 text-white transition-all cursor-pointer shadow-[3px_3px_0px_#0c0b09] hover:-rotate-2 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] z-50 flex items-center justify-center"
      onClick={() => modalActions.openModal("EXIT_GAME")}
      aria-label={t("exitGame.open")}
    >
      <LogOut className="size-4 text-red-500" />
    </button>
  );
}
