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
          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-rubik-wet-paint text-xl uppercase tracking-wider rounded-[16px_5px_18px_6px] border-2 border-stone-950 shadow-[4px_4px_0px_#0c0b09] transition-colors transition-transform hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer"
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
