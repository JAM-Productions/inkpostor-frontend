import React from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import { CircleQuestionMark, Play } from "lucide-react";
import { MIN_PLAYERS } from "../lib/constants";

export const GameResult: React.FC = () => {
  const { t } = useTranslation();
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
          className={`p-8 rounded-3xl border-2 transition-colors animate-fade-in animate-delay-200 animate-duration-slower ${
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
                ? t("result.impostorDefeated")
                : t("result.impostorWon")
              : t("result.voteResult")}
          </h1>

          <div className="text-xl md:text-2xl text-stone-300 font-medium space-y-2">
            {!ejectedId ? (
              <p className="text-stone-400 italic">
                {t("result.nobodyEjected")}
              </p>
            ) : (
              <>
                <p>{t("result.wasEjected", { name: ejectedName })}</p>
                {!isGameOver && (
                  <p className="text-stone-400 italic">
                    {t("result.stillAmongUs")}
                  </p>
                )}
              </>
            )}

            {isGameOver && (
              <p className="">
                {t("result.wasImpostor", { name: impostorName })}
              </p>
            )}
          </div>
        </div>

        {isGameOver && (
          <div className="bg-stone-800 rounded-2xl p-6 border border-stone-700 shadow-xl animate-fade-in animate-delay-1000 animate-duration-slower">
            <p className="text-stone-400 mb-2 uppercase tracking-wider text-sm font-semibold">
              {t("result.secretWord")}
            </p>
            <div className="text-3xl font-black text-white">
              {secretWord ? t(`words.${secretWord}`) : ""}
            </div>
          </div>
        )}

        {isHost ? (
          <button
            onClick={isGameOver ? actions.playAgain : actions.nextRound}
            className={`w-full cursor-pointer group relative overflow-hidden rounded-2xl p-0.5 transition-all hover:scale-[1.02] active:scale-[0.98] animate-fade-in animate-delay-2000 animate-duration-slower ${
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
                  {t("result.playAgain")}
                </span>
              ) : (
                <>
                  <Play className="fill-current w-5 h-5" />
                  <span className="sm:text-xl text-lg font-extrabold uppercase">
                    {t("result.nextRound")}
                  </span>
                </>
              )}
            </div>
          </button>
        ) : (
          <div className="animate-fade-in animate-delay-2000 animate-duration-slower">
            <div className="text-stone-500 animate-pulse mt-8 ">
              {isGameOver
                ? t("result.waitingRestart")
                : t("result.waitingContinue")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
