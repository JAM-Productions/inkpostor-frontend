import React from "react";
import { useModalStore } from "../../store/modalStore";
import { RulesModal } from "./RulesModal";
import { EndGameModal } from "./EndGameModal";

export const ModalRenderer: React.FC = () => {
  const activeModal = useModalStore((state) => state.activeModal);
  const closeModal = useModalStore((state) => state.actions.closeModal);

  if (!activeModal) return null;

  switch (activeModal) {
    case "RULES":
      return <RulesModal isOpen={true} onClose={closeModal} />;
    case "END_GAME":
      return <EndGameModal isOpen={true} onClose={closeModal} />;
    default:
      return null;
  }
};
