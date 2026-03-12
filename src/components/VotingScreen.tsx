import React, { useState } from "react";
import { useGameStore } from "../store/gameState";
import { SkipForward, CheckCircle2 } from "lucide-react";

export const VotingScreen: React.FC = () => {
  const players = useGameStore((state) => state.players);
  const myId = useGameStore((state) => state.myId);
  const votes = useGameStore((state) => state.votes);
  const actions = useGameStore((state) => state.actions);

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const me = players.find((p) => p.id === myId);
  const hasVoted = me?.hasVoted;

  const handleVote = () => {
    if (selectedPlayer && !hasVoted) {
      actions.vote(selectedPlayer);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-stone-900 p-4 md:p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">
            Voting Time
          </h1>
          <p className="text-stone-400 text-lg">Who is the Inkpostor?</p>
        </div>

        {!hasVoted ? (
          <div className="bg-stone-800 rounded-3xl p-6 border border-stone-700 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players
                .filter((p) => p.id !== myId)
                .map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedPlayer === player.id
                        ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                        : "border-stone-700 bg-stone-900 hover:border-stone-500"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        selectedPlayer === player.id
                          ? "bg-blue-500 text-white"
                          : "bg-stone-800 text-stone-400"
                      }`}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`text-lg font-semibold ${selectedPlayer === player.id ? "text-white" : "text-stone-300"}`}
                    >
                      {player.name}
                    </span>
                  </button>
                ))}

              <button
                onClick={() => setSelectedPlayer("skip")}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left col-span-1 md:col-span-2 ${
                  selectedPlayer === "skip"
                    ? "border-stone-400 bg-stone-800 scale-[1.02]"
                    : "border-stone-700 bg-stone-900 hover:border-stone-500 hover:bg-stone-800"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                    selectedPlayer === "skip"
                      ? "bg-stone-600 text-white"
                      : "bg-stone-800 text-stone-400"
                  }`}
                >
                  <SkipForward className="w-6 h-6" />
                </div>
                <span
                  className={`text-lg font-semibold ${selectedPlayer === "skip" ? "text-white" : "text-stone-300"}`}
                >
                  Skip Vote
                </span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-700">
              <button
                onClick={handleVote}
                disabled={!selectedPlayer}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
              >
                Confirm Vote
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-stone-800 rounded-3xl p-12 border border-stone-700 shadow-xl text-center flex flex-col items-center justify-center min-h-[400px]">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Vote Cast!</h2>
            <p className="text-stone-400">
              Waiting for other players to vote...
            </p>

            <div className="mt-8 flex gap-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={`w-3 h-3 rounded-full ${p.hasVoted ? "bg-emerald-500" : "bg-stone-700"}`}
                />
              ))}
            </div>
            <p className="text-sm text-stone-500 mt-4">
              {Object.keys(votes).length} / {players.length} votes recorded
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
