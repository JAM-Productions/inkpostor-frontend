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
      data-testid="end-game-btn"
      className="p-2.5 rounded-[14px_4px_16px_5px] bg-[#26221d] hover:bg-stone-800 border-2 border-stone-950 text-white transition-all cursor-pointer shadow-[3px_3px_0px_#0c0b09] hover:rotate-2 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09]"
      onClick={() => modalActions.openModal("END_GAME")}
      aria-label={t("endGame.open")}
    >
      <Flag className="size-4 text-amber-300 fill-amber-300" />
    </button>
  );
}
