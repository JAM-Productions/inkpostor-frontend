import React from "react";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import { BaseModal } from "./BaseModal";

interface ExitGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExitGameModal: React.FC<ExitGameModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const actions = useGameStore((state) => state.actions);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      id="exit-game"
      title={t("exitGame.title")}
      closeLabel={t("exitGame.closeDialog")}
      icon={<LogOut className="size-6 text-red-500" />}
      footer={
        <div className="flex gap-4 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
          >
            {t("exitGame.cancel")}
          </button>
          <button
            data-testid="confirm-exit-game-button"
            onClick={() => {
              actions.exitGame();
              onClose();
            }}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer uppercase"
          >
            {t("exitGame.confirm")}
          </button>
        </div>
      }
    >
      <div className="text-center space-y-4">
        <p className="text-stone-400">{t("exitGame.description")}</p>
      </div>
    </BaseModal>
  );
};
