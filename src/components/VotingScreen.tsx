import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import { SkipForward, CheckCircle2, Search } from "lucide-react";
import { VoteDotsPreview } from "./VoteDotsPreview";
import { getPlayerColorClass } from "../lib/playerColors";

export const VotingScreen: React.FC = () => {
  const { t } = useTranslation();
  const players = useGameStore((state) => state.players);
  const playersRemaining = players.filter((p) => !p.isEjected);
  const myId = useGameStore((state) => state.myId);
  const votes = useGameStore((state) => state.votes);
  const actions = useGameStore((state) => state.actions);
  const currentRound = useGameStore((state) => state.currentRound);

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const me = players.find((p) => p.id === myId);
  const hostId = useGameStore((state) => state.hostId);
  const hasVoted = me?.hasVoted;
  const hasBeenEjected = me?.isEjected;

  const effectiveSelectedPlayer =
    hasVoted && myId ? (votes[myId] ?? selectedPlayer) : selectedPlayer;

  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const votedForId of Object.values(votes)) {
      counts[votedForId] = (counts[votedForId] || 0) + 1;
    }
    return counts;
  }, [votes]);

  const handleVote = () => {
    if (selectedPlayer && !hasVoted && !hasBeenEjected && !isSubmitting) {
      setIsSubmitting(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
      actions.vote(selectedPlayer);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-stone-900 p-4 md:p-8">
      <div className="w-full max-w-2xl space-y-8 pt-20">
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-4xl text-white uppercase font-rubik-wet-paint font-extralight">
            {t("voting.title")}
          </h1>
          <p className="text-stone-300 text-xl sm:text-2xl font-bold mb-7">
            {t("voting.round", { round: currentRound })}
          </p>
          <p
            className={`text-stone-400 text-base sm:text-lg tracking-wider font-semibold ${
              hasVoted ? "invisible" : "visible"
            }`}
          >
            {t("voting.whoIsInkpostor")}
          </p>
        </div>

        <div className="bg-stone-800 rounded-3xl p-6 border border-stone-700 shadow-xl ">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 overflow-y-auto px-2 py-2 max-h-[50vh] custom-scrollbar">
            {players
              .filter((p) => p.id !== myId)
              .map((player, index) => (
                <button
                  type="button"
                  key={player.id}
                  onClick={() => setSelectedPlayer(player.id)}
                  disabled={player.isEjected || hasBeenEjected || hasVoted}
                  className={`flex items-center gap-3 sm:p-4 p-3 rounded-xl border-2 transition-all duration-200 text-left animate-pulse-fade-in  ${
                    player.isEjected
                      ? "opacity-40 border-stone-700 bg-stone-900 cursor-not-allowed"
                      : effectiveSelectedPlayer === player.id
                        ? "border-ink-primary bg-ink-primary/10 scale-[1.02] "
                        : hasVoted
                          ? "border-stone-700 bg-stone-900 cursor-not-allowed"
                          : "border-stone-700 bg-stone-900 hover:border-stone-500 cursor-pointer"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg ${getPlayerColorClass(player.id, hostId, players)}`}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-sm sm:text-lg font-semibold ${effectiveSelectedPlayer === player.id ? "text-white" : "text-stone-300"}`}
                    >
                      {player.name}
                    </span>
                    {player.isSuspected && (
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-red-400 uppercase tracking-tight">
                        <Search className="w-3 h-3" />
                        {t("canvas.suspect")}
                      </span>
                    )}
                  </div>

                  <VoteDotsPreview
                    count={voteCounts[player.id] || 0}
                    testId={`vote-dot-${player.id}`}
                    isSelected={effectiveSelectedPlayer === player.id}
                  />
                </button>
              ))}
          </div>

          <div className="mt-4 space-y-6">
            <button
              type="button"
              onClick={() => setSelectedPlayer("skip")}
              disabled={hasVoted}
              className={` w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left col-span-1 md:col-span-2 ${
                hasBeenEjected
                  ? "hidden"
                  : effectiveSelectedPlayer === "skip"
                    ? "bg-white/10 border-white/40 scale-[1.02]"
                    : hasVoted
                      ? "border-stone-700 bg-stone-900 opacity-50 cursor-not-allowed"
                      : "border-stone-700 bg-stone-900 hover:border-stone-500 cursor-pointer"
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                  effectiveSelectedPlayer === "skip"
                    ? "bg-white/30 text-white"
                    : "bg-stone-800 text-stone-400"
                }`}
              >
                <SkipForward className="sm:w-6 sm:h-6 w-4.5 h-4.5" />
              </div>
              <span
                className={`text-sm sm:text-lg font-semibold ${effectiveSelectedPlayer === "skip" ? "text-white" : "text-stone-300"}`}
              >
                {t("voting.skipVote")}
              </span>

              <VoteDotsPreview
                count={voteCounts["skip"] || 0}
                testId="vote-dot-skip"
                isSelected={effectiveSelectedPlayer === "skip"}
              />
            </button>
            {!hasBeenEjected && !hasVoted ? (
              <button
                type="button"
                onClick={handleVote}
                disabled={!selectedPlayer || isSubmitting}
                className="w-full py-3 rounded-xl bg-ink-primary hover:bg-ink-primary-accent text-white sm:text-xl text-lg disabled:opacity-50 transition-all active:scale-95 cursor-pointer font-extrabold"
              >
                {t("voting.confirmVote")}
              </button>
            ) : hasVoted ? (
              <div className="w-full flex-col text-center flex items-center justify-center space-y-4 py-4 bg-stone-900/50 rounded-2xl border border-stone-700/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <h2 className="text-xl font-bold text-white">
                    {t("voting.voteCast")}
                  </h2>
                </div>
                <p className="text-stone-400 animate-pulse text-sm sm:text-base">
                  {t("voting.waitingOthers")}
                </p>

                <div className="flex flex-col items-center gap-3 w-full px-4">
                  <div className="flex gap-2">
                    {playersRemaining.map((p) => (
                      <div
                        key={p.id}
                        className={`w-3 h-3 rounded-full transition-colors duration-500 ${p.hasVoted ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-stone-700"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 font-medium">
                    {t("voting.votesRecorded", {
                      count: Object.keys(votes).length,
                      total: playersRemaining.length,
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full flex-col text-center flex items-center justify-center space-y-2">
                <p className="text-ink-primary-accent text-sm sm:text-base font-bold">
                  {t("voting.ejected")}
                </p>
                <p className="text-stone-400 animate-pulse text-sm sm:text-base">
                  {t("voting.waitingOthers")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
