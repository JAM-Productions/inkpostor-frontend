import React, { useMemo } from "react";
import { useGameStore } from "../store/gameState";
import { Skull, Trophy, Play } from "lucide-react";

export const GameResult: React.FC = () => {
  const impostorId = useGameStore((state) => state.impostorId);
  const players = useGameStore((state) => state.players);
  const secretWord = useGameStore((state) => state.secretWord);
  const secretCategory = useGameStore((state) => state.secretCategory);
  const votes = useGameStore((state) => state.votes);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const actions = useGameStore((state) => state.actions);

  const isHost = myId === hostId;

  // Tally votes
  const ejectedResult = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(votes).forEach((vote) => {
      counts[vote] = (counts[vote] || 0) + 1;
    });

    let maxVotes = 0;
    let ejectedId: null | string = null;
    let isTie = false;

    Object.entries(counts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        ejectedId = id;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    });

    if (isTie || ejectedId === "skip") return null;
    return ejectedId;
  }, [votes]);

  const impostorCaught = ejectedResult === impostorId;
  const impostorName =
    players.find((p) => p.id === impostorId)?.name || "Unknown";
  const ejectedName = players.find((p) => p.id === ejectedResult)?.name;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-950">
      {/* We could add react-confetti here if installed, but for MVP CSS animations are enough */}
      <div className="max-w-2xl w-full text-center space-y-8 z-10">
        <div
          className={`p-8 rounded-3xl border-2 ${impostorCaught ? "bg-emerald-950/40 border-emerald-500/30" : "bg-red-950/40 border-red-500/30"}`}
        >
          <div className="flex justify-center mb-6">
            {impostorCaught ? (
              <Trophy className="w-24 h-24 text-emerald-400" />
            ) : (
              <Skull className="w-24 h-24 text-red-500" />
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
            {impostorCaught ? "Impostor Defeated!" : "Impostor Won!"}
          </h1>

          <div className="text-xl md:text-2xl text-stone-300 font-medium space-y-2">
            {!ejectedResult ? (
              <p>Votes were tied or skipped.</p>
            ) : (
              <p>
                <span className="font-bold text-white">{ejectedName}</span> was
                ejected.
              </p>
            )}

            <p className="mt-4">
              <span className="font-bold text-white">{impostorName}</span> was
              the Inkpostor!
            </p>
          </div>
        </div>

        <div className="bg-stone-800 rounded-2xl p-6 border border-stone-700 shadow-xl">
          <p className="text-stone-400 mb-2 uppercase tracking-wider text-sm font-semibold">
            The secret word was
          </p>
          <div className="text-3xl font-black text-white">{secretWord}</div>
          <div className="text-stone-500 mt-1">{secretCategory}</div>
        </div>

        {isHost ? (
          <button
            onClick={actions.playAgain}
            className="w-full group relative overflow-hidden rounded-2xl bg-white text-stone-900 p-[2px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex h-full w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-5 font-black text-stone-900">
              <Play className="fill-stone-900 w-6 h-6" />
              <span className="text-xl tracking-wide uppercase">
                Play Again
              </span>
            </div>
          </button>
        ) : (
          <div className="text-stone-500 animate-pulse mt-8">
            Waiting for host to start a new game...
          </div>
        )}
      </div>
    </div>
  );
};
