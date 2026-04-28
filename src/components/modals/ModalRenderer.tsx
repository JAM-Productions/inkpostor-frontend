import React from "react";
import { useModalStore } from "../../store/modalStore";
import { RulesModal } from "./RulesModal";
import { EndGameModal } from "./EndGameModal";
import { KickPlayerModal } from "./KickPlayerModal";

export const ModalRenderer: React.FC = () => {
  const activeModal = useModalStore((state) => state.activeModal);
  const modalData = useModalStore((state) => state.modalData);
  const closeModal = useModalStore((state) => state.actions.closeModal);

  if (!activeModal) return null;

  switch (activeModal) {
    case "RULES":
      return <RulesModal isOpen={true} onClose={closeModal} />;
    case "END_GAME":
      return <EndGameModal isOpen={true} onClose={closeModal} />;
    case "KICK_PLAYER":
      return (
        <KickPlayerModal
          isOpen={true}
          onClose={closeModal}
          playerId={modalData?.playerId}
        />
      );
    default:
      return null;
  }
};
