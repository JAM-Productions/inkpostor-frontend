import React from "react";
import { useTranslation } from "react-i18next";
import { useGameResult } from "../hooks/useGameResult";
import { GameOverActions } from "./result/GameOverActions";
import { NextRoundActions } from "./result/NextRoundActions";
import { ResultPanel, type ResultTone } from "./result/ResultPanel";
import { RevealBody } from "./result/RevealBody";
import { RoundBody } from "./result/RoundBody";
import { SecretWordPanel } from "./result/SecretWordPanel";
import { VerdictBody } from "./result/VerdictBody";

const GLOW_TONES: Record<ResultTone, string> = {
  win: "bg-emerald-600",
  lose: "bg-red-600",
  neutral: "bg-amber-600",
};

/**
 * Results screen. Every game passes through here, both between rounds and at the
 * end, and it is really three screens in one — each with its own body:
 *
 * - {@link RevealBody} (A): closed instead of played out, so nobody won.
 * - {@link VerdictBody} (B): played out, so somebody did.
 * - {@link RoundBody} (C): the round is over but the game is not.
 *
 * Every case and every text they can print is catalogued in docs/GAME_RESULT.md.
 * The room state behind the choice is worked out in {@link useGameResult}.
 */
export const GameResult: React.FC = () => {
  const { t } = useTranslation();
  const result = useGameResult();
  const { isGameOver, isRevealOnly } = result;

  // Only a game that was played out is tinted by its winner: a reveal has no
  // verdict to celebrate, and a round result has not decided anything yet.
  const tone: ResultTone =
    isGameOver && !isRevealOnly
      ? result.allImpostorsDefeated
        ? "win"
        : "lose"
      : "neutral";

  const title = isRevealOnly
    ? t("result.impostorsTitle", { count: result.impostorPlayers.length })
    : isGameOver
      ? t(
          result.allImpostorsDefeated
            ? "result.impostorDefeated"
            : "result.impostorWon",
        )
      : t("result.voteResult");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-8 sm:px-6 sm:pt-20 md:pt-24 bg-ink-bg relative overflow-hidden">
      {/* Background ambient light */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[130px] rounded-full opacity-30 pointer-events-none transition-colors duration-1000 ${GLOW_TONES[tone]}`}
      />

      <div className="max-w-2xl w-full text-center space-y-6 z-10">
        <ResultPanel tone={tone} title={title}>
          {isRevealOnly ? (
            <RevealBody
              impostors={result.impostorPlayers}
              hostId={result.hostId}
              impostorsWereLine={result.impostorsWereLine}
            />
          ) : isGameOver ? (
            <VerdictBody
              impostors={result.impostorPlayers}
              players={result.players}
              hostId={result.hostId}
              ejectedPlayer={result.ejectedPlayer}
              ejectedName={result.ejectedName}
              isEjectedImpostor={result.isEjectedImpostor}
              severalImpostors={result.severalImpostors}
              impostorNames={result.impostorNames}
              impostorsWereLine={result.impostorsWereLine}
              guessingImpostorName={result.guessingImpostorName}
              impostorGuessedCorrectly={result.impostorGuessedCorrectly}
              impostorOutOfGuesses={result.impostorOutOfGuesses}
            />
          ) : (
            <RoundBody
              players={result.players}
              hostId={result.hostId}
              ejectedPlayer={result.ejectedPlayer}
              ejectedName={result.ejectedName}
              isEjectedImpostor={result.isEjectedImpostor}
              remainingImpostorCount={result.remainingImpostorCount}
            />
          )}
        </ResultPanel>

        {isGameOver && <SecretWordPanel secretWord={result.secretWord} />}

        {isGameOver ? (
          <GameOverActions isHost={result.isHost} />
        ) : (
          <NextRoundActions
            players={result.players}
            hasConfirmedNewRound={result.hasConfirmedNewRound}
            amIEjected={result.amIEjected}
          />
        )}
      </div>
    </div>
  );
};
