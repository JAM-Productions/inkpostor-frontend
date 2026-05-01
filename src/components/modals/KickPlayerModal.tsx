import React, { useEffect } from "react";
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

  useEffect(() => {
    if (isOpen && !playerToKick) {
      onClose();
    }
  }, [isOpen, playerToKick, onClose]);

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
      icon={<UserMinus className="w-5 h-5 text-red-400" />}
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
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-bold bg-stone-700 text-stone-200 hover:bg-stone-600 transition-colors"
          >
            {t("canvas.cancel", "Cancel")}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            {t("canvas.kickConfirm", "Vote to Kick")}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
