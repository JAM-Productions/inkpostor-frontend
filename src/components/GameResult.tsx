import React from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import { CircleQuestionMark, Home, Play } from "lucide-react";
import { getPlayerIconColorClass } from "../lib/playerColors";

export const GameResult: React.FC = () => {
  const { t } = useTranslation();
  const impostorId = useGameStore((state) => state.impostorId);
  const rawImpostorIds = useGameStore((state) => state.impostorIds);
  const impostorIdSet = React.useMemo(() => {
    const list =
      rawImpostorIds && rawImpostorIds.length > 0
        ? rawImpostorIds
        : impostorId
          ? [impostorId]
          : [];
    return new Set(list);
  }, [rawImpostorIds, impostorId]);
  const impostorIds = Array.from(impostorIdSet);
  const players = useGameStore((state) => state.players) || [];
  const secretWord = useGameStore((state) => state.secretWord);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const actions = useGameStore((state) => state.actions);
  const isHost = myId === hostId;
  const ejectedId = useGameStore((state) => state.ejectedId);
  const gameEnded = useGameStore((state) => state.gameEnded);
  const impostorGuessedCorrectly = useGameStore(
    (state) => state.impostorGuessedCorrectly,
  );
  const impostorOutOfGuesses = useGameStore(
    (state) => state.impostorOutOfGuesses,
  );

  const ejectedWasImpostorState = useGameStore(
    (state) => state.ejectedWasImpostor,
  );
  const remainingImpostorCountState = useGameStore(
    (state) => state.remainingImpostorCount,
  );

  const me = players.find((p) => p.id === myId);
  const hasConfirmedNewRound = me?.hasConfirmedNewRound;

  // Active (non-ejected) players
  const activeImpostors = players.filter(
    (p) => impostorIdSet.has(p.id) && !p.isEjected && p.id !== ejectedId,
  );
  const isEjectedImpostor =
    ejectedWasImpostorState ??
    (ejectedId ? impostorIdSet.has(ejectedId) : false);
  const remainingImpostorCount =
    remainingImpostorCountState ?? activeImpostors.length;

  const hasKnownImpostors = impostorIdSet.size > 0;

  // Crewmates win if all known impostors are eliminated or out of guesses (and no correct guess)
  const allImpostorsDefeated =
    hasKnownImpostors &&
    (activeImpostors.length === 0 || impostorOutOfGuesses) &&
    !impostorGuessedCorrectly;

  const isGameOver = gameEnded;
  const impostorNames =
    players
      .reduce<string[]>((acc, p) => {
        if (impostorIdSet.has(p.id)) acc.push(p.name);
        return acc;
      }, [])
      .join(", ") ||
    players.find((p) => p.id === impostorId)?.name ||
    "Unknown";
  const ejectedPlayer = players.find((p) => p.id === ejectedId);
  const ejectedName = ejectedPlayer?.name;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-8 sm:px-6 sm:pt-20 md:pt-24 bg-ink-bg relative overflow-hidden">
      {/* Background ambient light */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[130px] rounded-full opacity-30 pointer-events-none transition-colors duration-1000 ${
          isGameOver
            ? allImpostorsDefeated
              ? "bg-emerald-600"
              : "bg-red-600"
            : "bg-amber-600"
        }`}
      />

      <div className="max-w-2xl w-full text-center space-y-6 z-10">
        <div
          className={`relative p-6 sm:p-8 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 shadow-[6px_6px_0px_#0c0b09] transition-colors animate-fade-in animate-delay-200 animate-duration-slower ${
            isGameOver
              ? allImpostorsDefeated
                ? "border-emerald-600 bg-emerald-950/80 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
                : "border-red-600 bg-red-950/80 shadow-[0_0_50px_rgba(220,38,38,0.3)]"
              : "bg-ink-surface border-stone-950"
          }`}
        >
          {/* Taped top corner accent */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 h-6 bg-amber-100/30 border border-stone-400/40 rounded-sm transform rotate-1 pointer-events-none shadow-sm z-20" />

          <h1 className="mb-6 text-3xl font-rubik-wet-paint uppercase tracking-wide text-white md:text-5xl">
            {isGameOver
              ? allImpostorsDefeated
                ? t("result.impostorDefeated")
                : t("result.impostorWon")
              : t("result.voteResult")}
          </h1>

          <div className="mb-4 flex justify-center">
            {ejectedPlayer ? (
              <div
                data-testid="ejected-player-card"
                className="relative flex items-center gap-3.5 rounded-[18px_6px_20px_8px] border-2 border-stone-700 bg-[#181512] px-4 py-3.5 text-left shadow-[4px_4px_0px_#000] animate-pop-in overflow-hidden max-w-full"
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-stone-950 font-handwritten text-xl font-bold shadow-[2px_2px_0px_#000] ${getPlayerIconColorClass(
                    ejectedPlayer.id,
                    hostId,
                    players,
                  )}`}
                >
                  {ejectedPlayer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 pr-20">
                  <p className="truncate font-handwritten text-xl font-bold tracking-wide text-stone-200">
                    {ejectedPlayer.name}
                  </p>
                </div>
                <span className="absolute right-3 top-1/2 rounded border border-red-500/80 bg-red-950/80 px-2.5 py-0.5 font-rubik-wet-paint text-xs sm:text-sm text-red-400 uppercase tracking-widest pointer-events-none animate-stamp-in-centered animate-delay-500">
                  {t("result.ejectedBadge")}
                </span>
              </div>
            ) : isGameOver ? (
              allImpostorsDefeated ? (
                <img
                  src="/no-inkpostor-character.webp"
                  alt="Inkpostor"
                  className="sm:h-28 h-22 drop-shadow-md"
                />
              ) : (
                <img
                  src="/inkpostor-character.webp"
                  alt="Inkpostor"
                  className="sm:h-28 h-22 drop-shadow-md"
                />
              )
            ) : (
              <CircleQuestionMark
                data-testid="vote-result-question-icon"
                className="sm:size-16 size-14 text-amber-300"
              />
            )}
          </div>

          <div className="text-xl md:text-2xl text-amber-100 font-handwritten font-bold space-y-2">
            {isGameOver ? (
              ejectedId ? (
                <p>
                  {isEjectedImpostor
                    ? impostorIdSet.size > 1
                      ? t("result.ejectedAndWereImpostors", {
                          name: ejectedName,
                          names: impostorNames,
                        })
                      : t("result.ejectedAndWasImpostor", { name: ejectedName })
                    : impostorIdSet.size > 1
                      ? t("result.ejectedCrewmateWereImpostors", {
                          name: ejectedName,
                          names: impostorNames,
                        })
                      : t("result.ejectedCrewmateWasImpostor", {
                          name: ejectedName,
                          impostorName: impostorNames,
                          names: impostorNames,
                        })}
                </p>
              ) : (
                <p>
                  {impostorIds.length > 1
                    ? t("result.wereImpostors", { names: impostorNames })
                    : t("result.wasImpostor", { name: impostorNames })}
                </p>
              )
            ) : ejectedId ? (
              <p>{t("result.wasEjected", { name: ejectedName })}</p>
            ) : (
              <p className="text-amber-200/70 italic">
                {t("result.nobodyEjected")}
              </p>
            )}

            {!isGameOver && isEjectedImpostor && (
              <p
                className="text-amber-300 font-extrabold italic"
                data-testid="impostor-ejected-remaining"
              >
                {t("result.impostorEjectedMoreLeft", {
                  name: ejectedName,
                  count: remainingImpostorCount,
                })}
              </p>
            )}
            {!isGameOver && ejectedId && !isEjectedImpostor && (
              <p className="text-amber-200/70 italic">
                {t("result.stillAmongUs")}
              </p>
            )}

            {impostorGuessedCorrectly && (
              <p className="text-purple-300 font-bold">
                {t("result.impostorGuessedWord", { name: impostorNames })}
              </p>
            )}
          </div>
        </div>

        {isGameOver && (
          <div className="relative bg-ink-surface rounded-[20px_6px_22px_7px] p-6 border-3 border-stone-950 shadow-[5px_5px_0px_#0c0b09] animate-fade-in animate-delay-1000 animate-duration-slower">
            {secretWord ? (
              <>
                <p className="text-amber-200/80 mb-1 uppercase tracking-wider text-base font-handwritten font-bold">
                  {t("result.secretWord")}
                </p>
                <div className="text-3xl sm:text-4xl font-handwritten font-extrabold text-white drop-shadow-sm">
                  {secretWord}
                </div>
              </>
            ) : (
              <div
                className="flex items-center justify-center gap-2 text-xl font-handwritten font-bold text-stone-400"
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
              className="w-full cursor-pointer group relative overflow-hidden rounded-[22px_7px_18px_9px] border-3 border-stone-950 transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] shadow-[4px_4px_0px_#0c0b09] bg-red-600 hover:bg-red-500 text-white animate-fade-in animate-delay-2000 animate-duration-slower"
            >
              <div className="flex h-full w-full items-center justify-center gap-2 px-8 py-3.5">
                <span className="text-2xl sm:text-3xl tracking-wider uppercase font-rubik-wet-paint">
                  {t("result.playAgain")}
                </span>
              </div>
            </button>
          ) : (
            <div className="animate-fade-in animate-delay-2000 animate-duration-slower">
              <div className="text-amber-200/70 font-handwritten font-bold text-lg animate-pulse mt-6">
                {t("result.waitingRestart")}
              </div>
            </div>
          )
        ) : !hasConfirmedNewRound && !me?.isEjected ? (
          <button
            type="button"
            data-testid="next-round-btn"
            onClick={actions.nextRound}
            className="w-full min-h-14 cursor-pointer group relative overflow-hidden rounded-[22px_7px_18px_9px] border-3 border-stone-950 transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] shadow-[4px_4px_0px_#0c0b09] bg-amber-300 hover:bg-amber-200 text-stone-950 animate-fade-in animate-delay-2000 animate-duration-slower"
          >
            <div className="flex h-full w-full items-center justify-center gap-2.5 px-8 py-3.5">
              <Play className="fill-stone-950 size-6 text-stone-950" />
              <span className="sm:text-2xl text-xl font-handwritten font-bold uppercase">
                {t("result.nextRound")}
              </span>
            </div>
          </button>
        ) : (
          <div className="text-amber-200/70 font-handwritten font-bold text-lg flex items-center justify-center gap-3 py-4.75 animate-fade-in min-h-14">
            <span className="relative flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-3 bg-amber-500"></span>
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
            className="mt-6 px-6 py-2.5 rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-ink-surface text-amber-200 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer font-handwritten font-bold text-lg flex items-center justify-center gap-2 mx-auto shadow-[3px_3px_0px_#0c0b09] hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09]"
            data-testid="return-home-button"
          >
            <Home className="size-5 text-amber-400" />
            {t("result.returnToHome")}
          </button>
        )}
      </div>
    </div>
  );
};
