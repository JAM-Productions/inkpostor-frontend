import React from "react";
import { useModalStore } from "../../store/modalStore";
import { RulesModal } from "./RulesModal";
import { EndGameModal } from "./EndGameModal";

export const ModalRenderer: React.FC = () => {
  const activeModal = useModalStore((state) => state.activeModal);
  const actions = useModalStore((state) => state.actions);

  if (!activeModal) return null;

  switch (activeModal) {
    case "RULES":
      return (
        <RulesModal isOpen={true} onClose={() => actions.closeModal()} />
      );
    case "END_GAME":
      return (
        <EndGameModal isOpen={true} onClose={() => actions.closeModal()} />
      );
    default:
      return null;
  }
};
