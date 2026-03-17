import React from "react";
import { useGameStore } from "../store/gameState";
import { CircleQuestionMark, Play } from "lucide-react";
import { MIN_PLAYERS } from "../lib/constants";

export const GameResult: React.FC = () => {
  const impostorId = useGameStore((state) => state.impostorId);
  const players = useGameStore((state) => state.players);
  const secretWord = useGameStore((state) => state.secretWord);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const actions = useGameStore((state) => state.actions);
  const isHost = myId === hostId;
  const ejectedId = useGameStore((state) => state.ejectedId);
  const playersRemaining = players.filter((p) => !p.isEjected);

  const impostorCaught = ejectedId === impostorId;
  const isGameOver = impostorCaught || playersRemaining.length < MIN_PLAYERS;
  const impostorName =
    players.find((p) => p.id === impostorId)?.name || "Unknown";
  const ejectedName = players.find((p) => p.id === ejectedId)?.name;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-950">
      <div className="max-w-2xl w-full text-center space-y-8 z-10">
        <div
          className={`p-8 rounded-3xl border-2 transition-colors ${
            isGameOver
              ? impostorCaught
                ? "border-emerald-500/50 bg-emerald-950/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                : "border-red-500/50 bg-red-950/40 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
              : "bg-stone-900/60 border-stone-700"
          }`}
        >
          <div className="flex justify-center mb-4">
            {isGameOver ? (
              impostorCaught ? (
                <img
                  src="/no-inkpostor-character.webp"
                  alt="Inkpostor"
                  className="sm:h-28 h-22"
                />
              ) : (
                <img
                  src="/inkpostor-character.webp"
                  alt="Inkpostor"
                  className="sm:h-28 h-22"
                />
              )
            ) : (
              <CircleQuestionMark className="sm:w-16 sm:h-16 w-14 h-14 text-stone-400" />
            )}
          </div>

          <h1 className="text-4xl md:text-5xl text-white uppercase tracking-tight mb-8 font-rubik-wet-paint font-extralight">
            {isGameOver
              ? impostorCaught
                ? "Inkpostor Defeated"
                : "Inkpostor Won"
              : "Result of the vote"}
          </h1>

          <div className="text-xl md:text-2xl text-stone-300 font-medium space-y-2">
            {!ejectedId ? (
              <p className="text-stone-400 italic">Nobody was ejected...</p>
            ) : (
              <>
                <p>
                  <span className="font-bold text-white">{ejectedName}</span>{" "}
                  was ejected.
                </p>
                {!isGameOver && (
                  <p className="text-stone-400 italic">
                    Inkpostor is still among us...
                  </p>
                )}
              </>
            )}

            {isGameOver && (
              <p className="">
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
          </div>
        )}

        {isHost ? (
          <button
            onClick={isGameOver ? actions.playAgain : actions.nextRound}
            className={`w-full cursor-pointer group relative overflow-hidden rounded-2xl p-0.5 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isGameOver
                ? "bg-ink-primary hover:bg-ink-primary-accent"
                : "bg-ink-secondary hover:bg-white text-black"
            }`}
          >
            <div
              className={`flex h-full w-full items-center justify-center gap-2 rounded-2xl px-8 py-3 `}
            >
              {isGameOver ? (
                <span className="text-xl sm:text-2xl tracking-wide uppercase font-rubik-wet-paint font-extralight">
                  Play Again
                </span>
              ) : (
                <>
                  <Play className="fill-current w-5 h-5" />
                  <span className="sm:text-xl text-lg font-extrabold uppercase">
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
