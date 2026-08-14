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
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-[#181512] hover:bg-stone-800 text-amber-200 font-handwritten text-lg font-bold rounded-[16px_5px_18px_6px] border-2 border-stone-950 shadow-[3px_3px_0px_#0c0b09] transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer"
          >
            {t("exitGame.cancel")}
          </button>
          <button
            type="button"
            data-testid="confirm-exit-game-button"
            onClick={() => {
              actions.exitGame();
              onClose();
            }}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-rubik-wet-paint text-lg uppercase tracking-wider rounded-[16px_5px_18px_6px] border-2 border-stone-950 shadow-[3px_3px_0px_#0c0b09] transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer"
          >
            {t("exitGame.confirm")}
          </button>
        </div>
      }
    >
      <div className="text-center space-y-4">
        <p className="text-xl leading-relaxed text-stone-400 sm:text-2xl">
          {t("exitGame.description")}
        </p>
      </div>
    </BaseModal>
  );
};
