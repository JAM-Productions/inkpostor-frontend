import React from "react";
import { useTranslation } from "react-i18next";
import { BaseModal } from "./BaseModal";
import { useGameStore } from "../../store/gameState";
import { UserMinus } from "lucide-react";

interface KickPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
}

export const KickPlayerModal: React.FC<KickPlayerModalProps> = ({
  isOpen,
  onClose,
  playerId,
}) => {
  const { t } = useTranslation();
  const players = useGameStore((state) => state.players);
  const actions = useGameStore((state) => state.actions);

  const playerToKick = players.find((p) => p.id === playerId);

  const handleConfirm = () => {
    if (playerId) {
      actions.voteKickPlayer(playerId);
    }
    onClose();
  };

  if (!playerToKick) {
    return null;
  }

  return (
    <BaseModal
      id="kick-player-modal"
      isOpen={isOpen}
      onClose={onClose}
      closeLabel={t("canvas.cancel", "Cancel")}
      title={t("canvas.kickTitle", "Vote to Kick Player")}
      icon={<UserMinus className="size-5 text-red-400" />}
    >
      <div className="space-y-6">
        <p className="text-stone-300 text-lg">
          {t("canvas.kickConfirmationText", {
            name: playerToKick.name,
            defaultValue: "Are you sure you want to vote to kick {{name}}?",
          })}
        </p>

        <div className="flex gap-4">
          <button
            type="button"
            data-testid="cancel-kick-button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-[16px_5px_18px_6px] font-handwritten font-bold text-lg bg-[#181512] text-amber-200 hover:bg-stone-800 border-2 border-stone-950 shadow-[3px_3px_0px_#0c0b09] transition-colors transition-transform hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer"
          >
            {t("canvas.cancel", "Cancel")}
          </button>
          <button
            type="button"
            data-testid="confirm-kick-button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 rounded-[16px_5px_18px_6px] font-rubik-wet-paint text-lg text-white bg-red-600 hover:bg-red-500 uppercase tracking-wider border-2 border-stone-950 shadow-[3px_3px_0px_#0c0b09] transition-colors transition-transform hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer"
          >
            {t("canvas.kickConfirm", "Vote to Kick")}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
