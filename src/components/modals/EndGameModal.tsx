import React from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import { BaseModal } from "./BaseModal";

interface EndGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const actions = useGameStore((state) => state.actions);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      id="end-game"
      title={t("endGame.title")}
      closeLabel={t("endGame.closeDialog")}
      icon={<HelpCircle className="size-6 text-ink-primary" />}
      footer={
        <button
          type="button"
          data-testid="confirm-end-game-button"
          onClick={() => {
            actions.endGame();
            onClose();
          }}
          className="w-full py-3 bg-ink-primary hover:bg-ink-primary-accent text-white font-bold rounded-xl transition-[background-color,transform] active:scale-[0.98] cursor-pointer uppercase"
        >
          {t("endGame.endGame")}
        </button>
      }
    >
      <div className="text-center space-y-4">
        <p className="text-stone-400">{t("endGame.description")}</p>
      </div>
    </BaseModal>
  );
};
