import React, { useMemo } from "react";
import { useGameStore } from "../store/gameState";
import {
  Skull,
  Trophy,
  Play,
  ArrowRight,
  CircleQuestionMark,
} from "lucide-react";

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
  // For now that we dont have eject logic
  const isGameOver = impostorCaught || ejectedResult;
  // --------------------------------------
  const impostorName =
    players.find((p) => p.id === impostorId)?.name || "Unknown";
  const ejectedName = players.find((p) => p.id === ejectedResult)?.name;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-950">
      <div className="max-w-2xl w-full text-center space-y-8 z-10">
        <div
          className={`p-8 rounded-3xl border-2 transition-colors ${
            isGameOver
              ? impostorCaught
                ? "bg-emerald-950/40 border-emerald-500/30"
                : "bg-red-950/40 border-red-500/30"
              : "bg-stone-900/60 border-stone-700"
          }`}
        >
          <div className="flex justify-center mb-6">
            {isGameOver ? (
              impostorCaught ? (
                <Trophy className="w-24 h-24 text-emerald-400" />
              ) : (
                <Skull className="w-24 h-24 text-red-500" />
              )
            ) : (
              <CircleQuestionMark className="w-24 h-24 text-stone-400" />
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
            {isGameOver
              ? impostorCaught
                ? "Impostor Defeated!"
                : "Impostor Won!"
              : "Result of the vote"}
          </h1>

          <div className="text-xl md:text-2xl text-stone-300 font-medium space-y-2">
            {!ejectedResult ? (
              <p className="text-stone-400 italic">Nobody was ejected.</p>
            ) : (
              <p>
                <span className="font-bold text-white">{ejectedName}</span> was
                ejected.
              </p>
            )}

            {isGameOver && (
              <p className="mt-4">
                <span className="font-bold text-white">{impostorName}</span> was
                the Inkpostor!
              </p>
            )}
          </div>
        </div>

        {isGameOver && (
          <div className="bg-stone-800 rounded-2xl p-6 border border-stone-700 shadow-xl animate-in fade-in zoom-in duration-300">
            <p className="text-stone-400 mb-2 uppercase tracking-wider text-sm font-semibold">
              The secret word was
            </p>
            <div className="text-3xl font-black text-white">{secretWord}</div>
            <div className="text-stone-500 mt-1">{secretCategory}</div>
          </div>
        )}

        {isHost ? (
          <button
            onClick={isGameOver ? actions.playAgain : actions.nextRound}
            className={`w-full group relative overflow-hidden rounded-2xl p-[2px] transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isGameOver ? "bg-white text-stone-900" : "bg-stone-700 text-white"
            }`}
          >
            <div
              className={`flex h-full w-full items-center justify-center gap-2 rounded-2xl px-8 py-5 font-black ${isGameOver ? "bg-white" : "bg-stone-800"}`}
            >
              {isGameOver ? (
                <>
                  <Play className="fill-current w-6 h-6" />
                  <span className="text-xl tracking-wide uppercase">
                    Play Again
                  </span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-6 h-6" />
                  <span className="text-xl tracking-wide uppercase">
                    Next Round
                  </span>
                </>
              )}
            </div>
          </button>
        ) : (
          <div className="text-stone-500 animate-pulse mt-8">
            Waiting for host to {isGameOver ? "restart" : "continue"}...
          </div>
        )}
      </div>
    </div>
  );
};
