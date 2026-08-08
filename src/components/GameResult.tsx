import React from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import { CircleQuestionMark, Play, Home } from "lucide-react";
import { MIN_PLAYERS } from "../lib/constants";

export const GameResult: React.FC = () => {
  const { t } = useTranslation();
  const impostorId = useGameStore((state) => state.impostorId);
  const rawImpostorIds = useGameStore((state) => state.impostorIds) || [];
  const impostorIds =
    rawImpostorIds.length > 0 ? rawImpostorIds : impostorId ? [impostorId] : [];
  const players = useGameStore((state) => state.players) || [];
  const secretWord = useGameStore((state) => state.secretWord);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const actions = useGameStore((state) => state.actions);
  const isHost = myId === hostId;
  const ejectedId = useGameStore((state) => state.ejectedId);
  const playersRemaining = players.filter((p) => !p.isEjected);
  const gameEnded = useGameStore((state) => state.gameEnded);
  const impostorGuessedCorrectly = useGameStore(
    (state) => state.impostorGuessedCorrectly,
  );
  const impostorOutOfGuesses = useGameStore(
    (state) => state.impostorOutOfGuesses,
  );

  const me = players.find((p) => p.id === myId);
  const hasConfirmedNewRound = me?.hasConfirmedNewRound;

  // Active (non-ejected) impostors remaining in play
  const activeImpostors = players.filter(
    (p) => impostorIds.includes(p.id) && !p.isEjected && p.id !== ejectedId,
  );
  const isEjectedImpostor = ejectedId ? impostorIds.includes(ejectedId) : false;

  // If all impostors were caught/eliminated or out of guesses
  const allImpostorsDefeated =
    (activeImpostors.length === 0 || gameEnded || impostorOutOfGuesses) &&
    !impostorGuessedCorrectly;
  const isGameOver =
    allImpostorsDefeated || playersRemaining.length < MIN_PLAYERS || gameEnded;
  const impostorNames =
    players
      .filter((p) => impostorIds.includes(p.id))
      .map((p) => p.name)
      .join(", ") ||
    players.find((p) => p.id === impostorId)?.name ||
    "Unknown";
  const ejectedName = players.find((p) => p.id === ejectedId)?.name;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-950">
      <div className="max-w-2xl w-full text-center space-y-8 z-10">
        <div
          className={`p-8 rounded-3xl border-2 transition-colors animate-fade-in animate-delay-200 animate-duration-slower ${
            isGameOver
              ? allImpostorsDefeated
                ? "border-emerald-500/50 bg-emerald-950/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                : "border-red-500/50 bg-red-950/40 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
              : "bg-stone-900/60 border-stone-700"
          }`}
        >
          <div className="flex justify-center mb-4">
            {isGameOver ? (
              allImpostorsDefeated ? (
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
              <CircleQuestionMark className="sm:size-16 size-14 text-stone-400" />
            )}
          </div>

          <h1 className="text-4xl md:text-5xl text-white uppercase tracking-tight mb-8 font-rubik-wet-paint font-extralight">
            {isGameOver
              ? allImpostorsDefeated
                ? t("result.impostorDefeated")
                : t("result.impostorWon")
              : t("result.voteResult")}
          </h1>

          <div className="text-xl md:text-2xl text-stone-300 font-medium space-y-2">
            {!gameEnded &&
              (!ejectedId ? (
                <p className="text-stone-400 italic">
                  {t("result.nobodyEjected")}
                </p>
              ) : (
                <>
                  <p>{t("result.wasEjected", { name: ejectedName })}</p>
                  {!isGameOver &&
                    (isEjectedImpostor ? (
                      <p
                        className="text-amber-400 font-semibold italic"
                        data-testid="impostor-ejected-remaining"
                      >
                        {t("result.impostorEjectedMoreLeft", {
                          name: ejectedName,
                          count: activeImpostors.length,
                        })}
                      </p>
                    ) : (
                      <p className="text-stone-400 italic">
                        {t("result.stillAmongUs")}
                      </p>
                    ))}
                </>
              ))}

            {isGameOver && (
              <p className="">
                {impostorIds.length > 1
                  ? t("result.wereImpostors", { names: impostorNames })
                  : t("result.wasImpostor", { name: impostorNames })}
              </p>
            )}

            {impostorGuessedCorrectly && (
              <p className="text-purple-300 font-semibold">
                {t("result.impostorGuessedWord", { name: impostorNames })}
              </p>
            )}
          </div>
        </div>

        {isGameOver && (
          <div className="bg-stone-800 rounded-2xl p-6 border border-stone-700 shadow-xl animate-fade-in animate-delay-1000 animate-duration-slower">
            {secretWord ? (
              <>
                <p className="text-stone-400 mb-2 uppercase tracking-wider text-sm font-semibold">
                  {t("result.secretWord")}
                </p>
                <div className="text-3xl font-black text-white">
                  {secretWord}
                </div>
              </>
            ) : (
              /* The game can end before a word exists — e.g. the host ends it
                 while the players are still writing theirs. */
              <div
                className="flex items-center justify-center gap-2 text-xl font-semibold text-stone-500"
                data-testid="no-secret-word"
              >
                {t("result.noSecretWord")}
              </div>
            )}
          </div>
        )}

        {isGameOver ? (
          isHost ? (
            <button
              type="button"
              data-testid="play-again-btn"
              onClick={actions.playAgain}
              className="w-full cursor-pointer group relative overflow-hidden rounded-2xl p-0.5 transition-[background-color,transform] hover:scale-[1.02] active:scale-[0.98] animate-fade-in animate-delay-2000 animate-duration-slower bg-ink-primary hover:bg-ink-primary-accent "
            >
              <div
                className={`flex h-full w-full items-center justify-center gap-2 rounded-2xl px-8 py-3 `}
              >
                <span className="text-xl sm:text-2xl tracking-wide uppercase font-rubik-wet-paint font-extralight">
                  {t("result.playAgain")}
                </span>
              </div>
            </button>
          ) : (
            <div className="animate-fade-in animate-delay-2000 animate-duration-slower">
              <div className="text-stone-500 animate-pulse mt-8 ">
                {t("result.waitingRestart")}
              </div>
            </div>
          )
        ) : !hasConfirmedNewRound && !me?.isEjected ? (
          <button
            type="button"
            data-testid="next-round-btn"
            onClick={actions.nextRound}
            className="w-full min-h-14 cursor-pointer group relative overflow-hidden rounded-2xl p-0.5 transition-[background-color,transform] hover:scale-[1.02] active:scale-[0.98] animate-fade-in animate-delay-2000 animate-duration-slower bg-ink-secondary hover:bg-white text-black"
          >
            <div
              className={`flex h-full w-full items-center justify-center gap-2 rounded-2xl px-8 py-3 `}
            >
              <Play className="fill-current size-5" />
              <span className="sm:text-xl text-lg font-extrabold uppercase">
                {t("result.nextRound")}
              </span>
            </div>
          </button>
        ) : (
          <div className="text-stone-500 flex items-center justify-center gap-3 text-sm sm:text-base py-3.5 animate-fade-in min-h-14">
            <span className="relative flex size-2 sm:size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 sm:size-3 bg-stone-500"></span>
            </span>
            {t("result.waitingPlayers", {
              count: players.filter(
                (p) => p.hasConfirmedNewRound && !p.isEjected && p.isConnected,
              ).length,
              total: players.filter((p) => !p.isEjected && p.isConnected)
                .length,
            })}
          </div>
        )}
        {isGameOver && (
          <button
            type="button"
            aria-label="Return to Home"
            onClick={actions.exitGame}
            className="mt-6 px-6 py-2.5 rounded-xl border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-900 transition-[background-color,transform] cursor-pointer font-semibold text-sm flex items-center justify-center gap-2 mx-auto shadow-sm active:scale-95"
            data-testid="return-home-button"
          >
            <Home className="size-4 text-stone-400" />
            {t("result.returnToHome")}
          </button>
        )}
      </div>
    </div>
  );
};
