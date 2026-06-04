import React from "react";
import { useTranslation } from "react-i18next";
import { UserMinus } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import { useModalStore } from "../../store/modalStore";

interface VoteKickButtonProps {
  player: { id: string; name: string; isEjected?: boolean };
  requiredVotes: number;
  onAction?: () => void;
}

export const VoteKickButton: React.FC<VoteKickButtonProps> = ({
  player,
  requiredVotes,
  onAction,
}) => {
  const { t } = useTranslation();
  const myId = useGameStore((state) => state.myId);
  const kickVotes = useGameStore((state) => state.kickVotes);
  const actions = useGameStore((state) => state.actions);
  const openModal = useModalStore((state) => state.actions.openModal);

  // If the player is ourselves or already ejected, don't show the button
  if (player.id === myId || player.isEjected) return null;

  const hasVoted = kickVotes[player.id]?.includes(myId || "");

  const handleClick = () => {
    if (onAction) onAction();

    if (hasVoted) {
      // If already voted, it's an undo action. Just unvote directly.
      actions.voteKickPlayer(player.id);
    } else {
      // If not voted, open the confirmation modal.
      openModal("KICK_PLAYER", { playerId: player.id });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex shrink-0 items-center justify-center rounded-xl transition-colors cursor-pointer px-2 gap-1.5 ${
        hasVoted
          ? "bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30"
          : "bg-stone-900/50 text-stone-400 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/30"
      }`}
      title={t("canvas.kickPlayerAria", {
        name: player.name,
        defaultValue: "Vote to Kick {{name}}",
      })}
      aria-label={t("canvas.kickPlayerAria", {
        name: player.name,
        defaultValue: "Vote to Kick {{name}}",
      })}
    >
      <UserMinus className="w-4 h-4" />
      <span className="text-xs font-bold font-mono">
        {kickVotes[player.id]?.length || 0}/{requiredVotes}
      </span>
    </button>
  );
};
