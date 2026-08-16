import React from "react";
import { useTranslation } from "react-i18next";
import { EjectedPlayerCard } from "./EjectedPlayerCard";
import { ImpostorRevealList } from "./ImpostorRevealList";
import type { Player } from "../../store/gameState";

interface VerdictBodyProps {
  impostors: Player[];
  players: Player[];
  hostId: string | null;
  ejectedPlayer: Player | undefined;
  ejectedName: string | undefined;
  isEjectedImpostor: boolean;
  /** Whether the game was dealt more than one impostor. */
  severalImpostors: boolean;
  impostorNames: string;
  impostorsWereLine: string;
  guessingImpostorName: string;
  impostorGuessedCorrectly: boolean;
  impostorOutOfGuesses: boolean;
}

/**
 * Layout B of docs/GAME_RESULT.md — the verdict. The game was played out, so
 * somebody won. Endings with an ejection put that player in the spotlight; the
 * ones without (a correct guess, a spent guess pool, a kick that emptied the
 * room) reveal the impostors instead.
 */
export const VerdictBody: React.FC<VerdictBodyProps> = ({
  impostors,
  players,
  hostId,
  ejectedPlayer,
  ejectedName,
  isEjectedImpostor,
  severalImpostors,
  impostorNames,
  impostorsWereLine,
  guessingImpostorName,
  impostorGuessedCorrectly,
  impostorOutOfGuesses,
}) => {
  const { t } = useTranslation();

  const ejectionLine = isEjectedImpostor
    ? severalImpostors
      ? t("result.ejectedAndWereImpostors", {
          name: ejectedName,
          names: impostorNames,
        })
      : t("result.ejectedAndWasImpostor", { name: ejectedName })
    : severalImpostors
      ? t("result.ejectedCrewmateWereImpostors", {
          name: ejectedName,
          names: impostorNames,
        })
      : t("result.ejectedCrewmateWasImpostor", {
          name: ejectedName,
          impostorName: impostorNames,
        });

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
          <ImpostorRevealList impostors={impostors} hostId={hostId} />
        )}
      </div>

      <div className="text-xl md:text-2xl text-amber-100 font-handwritten font-bold space-y-2">
        <p>{ejectedPlayer ? ejectionLine : impostorsWereLine}</p>

        {impostorOutOfGuesses && (
          <p
            className="text-purple-300 font-bold"
            data-testid="impostor-out-of-guesses"
          >
            {t("result.impostorFailedGuesses", { name: guessingImpostorName })}
          </p>
        )}

        {impostorGuessedCorrectly && (
          <p className="text-purple-300 font-bold">
            {t("result.impostorGuessedWord", { name: guessingImpostorName })}
          </p>
        )}
      </div>
    </>
  );
};
