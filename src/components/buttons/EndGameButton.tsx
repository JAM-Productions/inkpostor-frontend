import { Flag } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import { useModalStore } from "../../store/modalStore";
import { useTranslation } from "react-i18next";

export function EndGameButton() {
  const { t } = useTranslation();
  const phase = useGameStore((state) => state.phase);
  const hostId = useGameStore((state) => state.hostId);
  const myId = useGameStore((state) => state.myId);
  const modalActions = useModalStore((state) => state.actions);
  const gameEnded = useGameStore((state) => state.gameEnded);

  const isHost = myId === hostId;

  if (!isHost || phase === "LOBBY" || gameEnded) {
    return null;
  }

  return (
    <button
      type="button"
      className="p-2 sm:p-2.5 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white transition-all cursor-pointer shadow-lg active:scale-95"
      onClick={() => modalActions.openModal("END_GAME")}
      aria-label={t("endGame.open")}
    >
      <Flag className="size-3 sm:size-3.5 fill-white" />
    </button>
  );
}
