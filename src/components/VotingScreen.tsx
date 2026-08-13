import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import {
  SkipForward,
  CheckCircle2,
  Search,
  Skull,
  PenLine,
} from "lucide-react";
import { VoteDotsPreview } from "./VoteDotsPreview";
import { ImpostorGuessForm } from "./ImpostorGuessForm";
import {
  getPlayerIconColorClass,
  getPlayerVotingCardColorClass,
} from "../lib/playerColors";

export const VotingScreen: React.FC = () => {
  const { t } = useTranslation();
  const players = useGameStore((state) => state.players);
  const playersRemaining = players.filter((p) => !p.isEjected && p.isConnected);
  const myId = useGameStore((state) => state.myId);
  const votes = useGameStore((state) => state.votes);
  const actions = useGameStore((state) => state.actions);
  const currentRound = useGameStore((state) => state.currentRound);
  const amIImpostor = useGameStore((state) => state.amIImpostor);
  const gameOptions = useGameStore((state) => state.gameOptions);
  const impostorGuessesUsed = useGameStore(
    (state) => state.impostorGuessesUsed,
  );

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const me = players.find((p) => p.id === myId);
  const hostId = useGameStore((state) => state.hostId);
  const hasVoted = me?.hasVoted;
  const hasBeenEjected = me?.isEjected;

  const attemptsLeft = gameOptions.impostorGuessAttempts - impostorGuessesUsed;
  const canGuess =
    !!amIImpostor &&
    gameOptions.impostorGuessEnabled &&
    attemptsLeft > 0 &&
    !hasBeenEjected;

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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-8 sm:px-6 sm:pt-20 md:pt-24 bg-[#161412] relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[130px] rounded-full opacity-25 pointer-events-none bg-red-950" />

      <div className="z-10 w-full max-w-2xl space-y-6 pt-16">
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-3xl sm:text-5xl text-white uppercase font-rubik-wet-paint tracking-wide">
            {t("voting.title")}
          </h1>
          <p className="text-amber-200/80 text-xl sm:text-2xl font-handwritten font-bold mb-4">
            {t("voting.round", { round: currentRound })}
          </p>
          <p
            className={`text-amber-200/60 text-lg font-handwritten font-bold tracking-wider ${
              hasVoted ? "invisible" : "visible"
            }`}
          >
            {t("voting.whoIsInkpostor")}
          </p>
        </div>

        <div className="relative bg-[#26221d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] p-6 sm:p-8 border-3 border-stone-950 shadow-[6px_6px_0px_#0c0b09]">
          {/* Taped corner accent */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-36 h-6 bg-amber-100/30 border border-stone-400/40 rounded-sm transform -rotate-1 pointer-events-none shadow-sm z-20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto p-1 max-h-[50vh] custom-scrollbar">
            {players.map((player, index) => (
              <button
                type="button"
                key={player.id}
                data-testid={`vote-card-${player.id}`}
                onClick={() => setSelectedPlayer(player.id)}
                disabled={
                  player.isEjected ||
                  hasBeenEjected ||
                  hasVoted ||
                  player.id === myId
                }
                className={`flex items-center gap-3 sm:p-4 p-3 rounded-[18px_6px_20px_7px] border-2 transition-colors transition-transform text-left animate-pulse-fade-in ${
                  player.id === myId
                    ? getPlayerVotingCardColorClass(
                        player.id,
                        hostId,
                        players,
                      ) + " cursor-not-allowed border-stone-800"
                    : player.isEjected
                      ? "border-stone-950 bg-[#181512]/60 opacity-40 grayscale cursor-not-allowed shadow-none"
                      : effectiveSelectedPlayer === player.id
                        ? `border-ink-primary border-amber-400 bg-amber-100/15 shadow-[4px_4px_0px_#000] -rotate-1 ${hasVoted ? "cursor-not-allowed" : "cursor-pointer"}`
                        : hasVoted
                          ? "border-stone-800 bg-[#181512] cursor-not-allowed opacity-75"
                          : "border-stone-800 bg-[#181512] hover:border-amber-400/70 hover:-rotate-1 shadow-[2px_2px_0px_#000] cursor-pointer"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`size-10 sm:size-12 rounded-full flex items-center justify-center font-handwritten font-bold text-base sm:text-xl border-2 border-stone-950 shadow-[2px_2px_0px_#000] ${getPlayerIconColorClass(player.id, hostId, players)} ${player.isEjected ? "opacity-60" : ""}`}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span
                    data-testid={`vote-name-${player.id}`}
                    className={`text-base sm:text-xl font-handwritten font-bold ${player.isEjected ? "text-stone-500 line-through" : effectiveSelectedPlayer === player.id ? "text-white" : "text-amber-100/90"}`}
                  >
                    {player.name}
                  </span>
                  {player.isSuspected && (
                    <span className="flex items-center gap-1 text-xs font-handwritten font-extrabold text-red-400 uppercase tracking-tight">
                      <Search className="size-3.5" />
                      {t("canvas.suspect")}
                    </span>
                  )}
                </div>

                {player.isEjected && (
                  <span className="flex items-center gap-1 text-red-500/80 ml-auto">
                    <Skull className="size-5" />
                  </span>
                )}
                <VoteDotsPreview
                  count={voteCounts[player.id] || 0}
                  testId={`vote-dot-${player.id}`}
                  isSelected={effectiveSelectedPlayer === player.id}
                />
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-5">
            <button
              type="button"
              data-testid="skip-vote-btn"
              onClick={() => setSelectedPlayer("skip")}
              disabled={hasVoted}
              className={`w-full flex items-center gap-3 p-3.5 sm:p-4 rounded-[18px_6px_20px_7px] border-2 transition-colors transition-transform text-left ${
                hasBeenEjected
                  ? "hidden"
                  : effectiveSelectedPlayer === "skip"
                    ? `bg-stone-800 border-amber-400 shadow-[4px_4px_0px_#000] -rotate-1 ${hasVoted ? "cursor-not-allowed" : "cursor-pointer"}`
                    : hasVoted
                      ? "border-stone-800 bg-[#181512] opacity-50 cursor-not-allowed"
                      : "border-stone-800 bg-[#181512] hover:border-amber-400/70 hover:-rotate-1 shadow-[2px_2px_0px_#000] cursor-pointer"
              }`}
            >
              <div
                className={`size-10 sm:size-12 rounded-full flex items-center justify-center font-bold text-xl border-2 border-stone-950 ${
                  effectiveSelectedPlayer === "skip"
                    ? "bg-amber-400 text-stone-950"
                    : "bg-stone-800 text-amber-200"
                }`}
              >
                <SkipForward className="sm:size-6 size-5" />
              </div>
              <span
                className={`text-base sm:text-xl font-handwritten font-bold ${effectiveSelectedPlayer === "skip" ? "text-white" : "text-amber-100/90"}`}
              >
                {t("voting.skipVote")}
              </span>

              <VoteDotsPreview
                count={voteCounts["skip"] || 0}
                testId="vote-dot-skip"
                isSelected={effectiveSelectedPlayer === "skip"}
              />
            </button>
            {canGuess && (
              <div className="rounded-[18px_6px_20px_7px] border-3 border-stone-950 bg-purple-950/60 p-4 shadow-[4px_4px_0px_#0c0b09]">
                <div className="mb-2 flex items-center gap-2 text-base font-handwritten font-bold uppercase tracking-wider text-purple-300">
                  <PenLine className="size-5" />
                  {t("impostorGuess.title")}
                </div>
                <ImpostorGuessForm attemptsLeft={attemptsLeft} />
              </div>
            )}
            {!hasBeenEjected && !hasVoted ? (
              <button
                type="button"
                data-testid="confirm-vote-btn"
                onClick={handleVote}
                disabled={!selectedPlayer || isSubmitting}
                className="w-full py-3.5 rounded-[20px_6px_18px_8px] border-3 border-stone-950 bg-red-600 hover:bg-red-500 text-white sm:text-2xl text-xl font-handwritten font-bold shadow-[4px_4px_0px_#0c0b09] transition-colors transition-transform hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] disabled:opacity-50 disabled:hover:rotate-0 cursor-pointer"
              >
                {t("voting.confirmVote")}
              </button>
            ) : hasVoted ? (
              <div className="w-full flex-col text-center flex items-center justify-center gap-y-3 py-4 bg-[#181512] rounded-[18px_6px_20px_7px] border-2 border-stone-800 shadow-[3px_3px_0px_#000]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-6 text-emerald-400" />
                  <h2 className="text-xl font-handwritten font-bold text-white">
                    {t("voting.voteCast")}
                  </h2>
                </div>
                <p className="text-amber-200/70 font-handwritten text-base animate-pulse">
                  {t("voting.waitingOthers")}
                </p>

                <div className="flex flex-col items-center gap-2 w-full px-4">
                  <div className="flex gap-2">
                    {playersRemaining.map((p) => (
                      <div
                        key={p.id}
                        className={`size-3 rounded-full border border-stone-950 transition-colors duration-500 ${p.hasVoted ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-stone-700"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-handwritten text-stone-400 font-bold">
                    {t("voting.votesRecorded", {
                      count: players.filter(
                        (p) => p.hasVoted && !p.isEjected && p.isConnected,
                      ).length,
                      total: playersRemaining.length,
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full flex-col text-center flex items-center justify-center gap-y-2">
                <p className="text-red-400 font-handwritten text-lg font-bold">
                  {t("voting.ejected")}
                </p>
                <p className="text-amber-200/70 font-handwritten text-base animate-pulse">
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
