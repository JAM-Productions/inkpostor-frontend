import React, { useState } from "react";
import { useGameStore } from "../store/gameState";
import { SkipForward, CheckCircle2 } from "lucide-react";

export const VotingScreen: React.FC = () => {
  const players = useGameStore((state) => state.players);
  const playersRemaining = players.filter((p) => !p.isEjected);
  const myId = useGameStore((state) => state.myId);
  const votes = useGameStore((state) => state.votes);
  const actions = useGameStore((state) => state.actions);
  const currentRound = useGameStore((state) => state.currentRound);

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const me = players.find((p) => p.id === myId);
  const hasVoted = me?.hasVoted;
  const hasBeenEjected = me?.isEjected;

  const handleVote = () => {
    if (selectedPlayer && !hasVoted && !hasBeenEjected) {
      actions.vote(selectedPlayer);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-stone-900 p-4 md:p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-4xl text-white uppercase font-rubik-wet-paint font-extralight">
            Voting Time
          </h1>
          <p className="text-stone-300 text-xl sm:text-2xl font-bold mb-7">
            Round {currentRound}
          </p>
          <p
            className={`text-stone-400 text-base sm:text-lg tracking-wider font-semibold ${
              hasVoted ? "invisible" : "visible"
            }`}
          >
            Who is the Inkpostor?
          </p>
        </div>

        {!hasVoted ? (
          <div className="bg-stone-800 rounded-3xl p-6 border border-stone-700 shadow-xl ">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 overflow-y-auto px-2 py-2 max-h-[50vh] custom-scrollbar">
              {players
                .filter((p) => p.id !== myId)
                .map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.id)}
                    disabled={player.isEjected || hasBeenEjected}
                    className={`flex items-center gap-3 sm:p-4 p-3 rounded-xl border-2 transition-all duration-200 text-left animate-pulse-fade-in  ${
                      player.isEjected
                        ? "opacity-40 border-stone-700 bg-stone-900"
                        : selectedPlayer === player.id
                          ? "border-ink-primary bg-ink-primary/10 scale-[1.02] cursor-pointer "
                          : "border-stone-700 bg-stone-900 hover:border-stone-500 cursor-pointer "
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg ${
                        selectedPlayer === player.id
                          ? "bg-ink-primary text-white"
                          : "bg-stone-800 text-stone-400"
                      }`}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`text-sm sm:text-lg font-semibold ${selectedPlayer === player.id ? "text-white" : "text-stone-300"}`}
                    >
                      {player.name}
                    </span>
                  </button>
                ))}
            </div>

            <div className="mt-4 space-y-6">
              <button
                onClick={() => setSelectedPlayer("skip")}
                className={` w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left col-span-1 md:col-span-2 cursor-pointer ${
                  hasBeenEjected
                    ? "hidden"
                    : selectedPlayer === "skip"
                      ? "bg-white/10 border-white/40 scale-[1.02]"
                      : "border-stone-700 bg-stone-900 hover:border-stone-500 "
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                    selectedPlayer === "skip"
                      ? "bg-white/30 text-white"
                      : "bg-stone-800 text-stone-400"
                  }`}
                >
                  <SkipForward className="sm:w-6 sm:h-6 w-4.5 h-4.5" />
                </div>
                <span
                  className={`text-sm sm:text-lg font-semibold ${selectedPlayer === "skip" ? "text-white" : "text-stone-300"}`}
                >
                  Skip Vote
                </span>
              </button>
              {!hasBeenEjected ? (
                <button
                  onClick={handleVote}
                  disabled={!selectedPlayer}
                  className="w-full py-3 rounded-xl bg-ink-primary hover:bg-ink-primary-accent text-white sm:text-xl text-lg disabled:opacity-50 transition-all active:scale-95 cursor-pointer font-extrabold"
                >
                  Confirm Vote
                </button>
              ) : (
                <div className="w-full flex-col text-center flex items-center justify-center space-y-2">
                  <p className="text-ink-primary-accent text-sm sm:text-base font-bold">
                    You have been ejected
                  </p>
                  <p className="text-stone-400 animate-pulse text-sm sm:text-base">
                    Waiting for other players to vote...
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className=" bg-stone-800 rounded-3xl p-12 border border-stone-700 shadow-xl text-center flex flex-col items-center justify-center min-h-100">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Vote Cast!</h2>
            <p className="text-stone-400 animate-pulse">
              Waiting for other players to vote...
            </p>

            <div className="mt-8 flex gap-2">
              {playersRemaining.map((p) => (
                <div
                  key={p.id}
                  className={`w-3 h-3 rounded-full ${p.hasVoted ? "bg-emerald-500" : "bg-stone-700"}`}
                />
              ))}
            </div>
            <p className="text-sm text-stone-500 mt-4">
              {Object.keys(votes).length} / {playersRemaining.length} votes
              recorded
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
