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
  const hostId = useGameStore((state) => state.hostId);
  const kickVotes = useGameStore((state) => state.kickVotes);
  const actions = useGameStore((state) => state.actions);
  const openModal = useModalStore((state) => state.actions.openModal);
  const players = useGameStore((state) => state.players);

  // If the player is ourselves, don't show the button
  if (player.id === myId) return null;

  // If the player is the host, they can't be voted out
  if (player.id === hostId) return null;

  const hasVoted = kickVotes[player.id]?.includes(myId || "");

  const activeKickVotesCount = (kickVotes[player.id] || []).filter(
    (voterId) => {
      const voter = players.find((p) => p.id === voterId);
      return voter?.isConnected;
    },
  ).length;

  const handleVoteKick = () => {
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
      onClick={handleVoteKick}
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
      <UserMinus className="size-4" />
      <span className="text-xs font-bold font-mono">
        {activeKickVotesCount}/{requiredVotes}
      </span>
    </button>
  );
};
