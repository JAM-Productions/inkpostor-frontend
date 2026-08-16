import React from "react";
import { ImpostorRevealList } from "./ImpostorRevealList";
import type { Player } from "../../store/gameState";

interface RevealBodyProps {
  impostors: Player[];
  hostId: string | null;
  impostorsWereLine: string;
}

/**
 * Layout A of docs/GAME_RESULT.md — the reveal. The game was closed instead of
 * played out (the host ended it, or a spoken round was revealed), so nobody was
 * ejected and nobody won: the cards are the whole answer.
 */
export const RevealBody: React.FC<RevealBodyProps> = ({
  impostors,
  hostId,
  impostorsWereLine,
}) => (
  <>
    <ImpostorRevealList impostors={impostors} hostId={hostId} />

    <p className="mt-5 text-xl md:text-2xl text-amber-100 font-handwritten font-bold">
      {impostorsWereLine}
    </p>
  </>
);
