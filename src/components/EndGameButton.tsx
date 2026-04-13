import { Flag } from "lucide-react";
import { useGameStore } from "../store/gameState";
import { EndGameModal } from "./modals/EndGameModal";
import React from "react";
import { useTranslation } from "react-i18next";

export function EndGameButton() {
  const { t } = useTranslation();
  const phase = useGameStore((state) => state.phase);
  const hostId = useGameStore((state) => state.hostId);
  const myId = useGameStore((state) => state.myId);

  const isHost = myId === hostId;

  const [isEndGameModalOpen, setIsEndGameModalOpen] = React.useState(false);

  if (!isHost || phase === "LOBBY" || phase === "RESULTS") {
    return null;
  }

  return (
    <>
      <button
        className="p-2.5 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white transition-all cursor-pointer shadow-lg active:scale-95"
        onClick={() => setIsEndGameModalOpen(true)}
        aria-label={t("endGame.open")}
      >
        <Flag className="w-3.5 h-3.5 fill-white" />
      </button>
      <EndGameModal
        isOpen={isEndGameModalOpen}
        onClose={() => setIsEndGameModalOpen(false)}
      />
    </>
  );
}
