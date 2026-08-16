import React from "react";
import { useTranslation } from "react-i18next";
import { CircleQuestionMark } from "lucide-react";
import { EjectedPlayerCard } from "./EjectedPlayerCard";
import type { Player } from "../../store/gameState";

interface RoundBodyProps {
  players: Player[];
  hostId: string | null;
  ejectedPlayer: Player | undefined;
  ejectedName: string | undefined;
  isEjectedImpostor: boolean;
  remainingImpostorCount: number;
}

/**
 * Layout C of docs/GAME_RESULT.md — the round result. The game goes on, so the
 * impostors are still a secret: this screen only says what the vote did. The
 * lines about a guess belong to an ending and are deliberately not here — the
 * server only reports one with the game already over (see VerdictBody).
 */
export const RoundBody: React.FC<RoundBodyProps> = ({
  players,
  hostId,
  ejectedPlayer,
  ejectedName,
  isEjectedImpostor,
  remainingImpostorCount,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-4 flex justify-center">
        {ejectedPlayer ? (
          <EjectedPlayerCard
            player={ejectedPlayer}
            hostId={hostId}
            players={players}
          />
        ) : (
          <CircleQuestionMark
            data-testid="vote-result-question-icon"
            className="sm:size-16 size-14 text-amber-300"
          />
        )}
      </div>

      <div className="text-xl md:text-2xl text-amber-100 font-handwritten font-bold space-y-2">
        {ejectedPlayer ? (
          <p>{t("result.wasEjected", { name: ejectedName })}</p>
        ) : (
          <p className="text-amber-200/70 italic">
            {t("result.nobodyEjected")}
          </p>
        )}

        {ejectedPlayer &&
          (isEjectedImpostor ? (
            <p
              className="text-amber-300 font-extrabold italic"
              data-testid="impostor-ejected-remaining"
            >
              {t("result.impostorEjectedMoreLeft", {
                name: ejectedName,
                count: remainingImpostorCount,
              })}
            </p>
          ) : (
            <p className="text-amber-200/70 italic">
              {t("result.stillAmongUs")}
            </p>
          ))}
      </div>
    </>
  );
};
