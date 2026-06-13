import React, { useEffect } from "react";
import { useModalStore, type ModalPayloads } from "../../store/modalStore";
import { useGameStore } from "../../store/gameState";
import { RulesModal } from "./RulesModal";
import { EndGameModal } from "./EndGameModal";
import { OptionsModal } from "./OptionsModal";
import { KickPlayerModal } from "./KickPlayerModal";
import { ExitGameModal } from "./ExitGameModal";

export const ModalRenderer: React.FC = () => {
  const activeModal = useModalStore((state) => state.activeModal);
  const modalData = useModalStore((state) => state.modalData);
  const closeModal = useModalStore((state) => state.actions.closeModal);
  const players = useGameStore((state) => state.players);
  const phase = useGameStore((state) => state.phase);

  useEffect(() => {
    if (activeModal === "KICK_PLAYER") {
      const data = modalData as ModalPayloads["KICK_PLAYER"];
      const playerExists = players.some((p) => p.id === data?.playerId);
      if (!playerExists || phase !== "DRAWING") {
        closeModal();
      }
    } else if (activeModal === "OPTIONS" && phase !== "LOBBY") {
      closeModal();
    }
  }, [activeModal, modalData, players, phase, closeModal]);

  if (!activeModal) return null;

  switch (activeModal) {
    case "RULES":
      return <RulesModal isOpen={true} onClose={closeModal} />;
    case "END_GAME":
      return <EndGameModal isOpen={true} onClose={closeModal} />;
    case "OPTIONS":
      if (phase !== "LOBBY") return null;
      return <OptionsModal isOpen={true} onClose={closeModal} />;
    case "KICK_PLAYER": {
      const data = modalData as ModalPayloads["KICK_PLAYER"];
      const playerToKick = players.find((p) => p.id === data?.playerId);

      if (!playerToKick) {
        return null;
      }

      return (
        <KickPlayerModal
          isOpen={true}
          onClose={closeModal}
          playerId={data.playerId}
        />
      );
    }
    case "EXIT_GAME":
      return <ExitGameModal isOpen={true} onClose={closeModal} />;
    default:
      return null;
  }
};
