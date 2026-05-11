import React from "react";
import { useModalStore, type ModalPayloads } from "../../store/modalStore";
import { RulesModal } from "./RulesModal";
import { EndGameModal } from "./EndGameModal";
import { OptionsModal } from "./OptionsModal";
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
    case "OPTIONS":
      return <OptionsModal isOpen={true} onClose={closeModal} />;
    case "KICK_PLAYER": {
      const data = modalData as ModalPayloads["KICK_PLAYER"];
      if (!data?.playerId) {
        // Queue modal close if opened with invalid data
        setTimeout(closeModal, 0);
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
    default:
      return null;
  }
};
