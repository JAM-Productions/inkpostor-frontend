import React from "react";
import { ImpostorPlayerCard } from "../ImpostorPlayerCard";
import type { Player } from "../../store/gameState";

interface ImpostorRevealListProps {
  impostors: Player[];
  hostId: string | null;
}

/**
 * The reveal itself: who the impostors were, one card each. Shown whenever the
 * screen has no ejected player to put in the spotlight — a closed game, or one
 * that ended on a guess (see docs/GAME_RESULT.md).
 *
 * `w-full` matters: this also sits inside a centring flex row, which would
 * otherwise shrink the grid to its content and leave the cards' percentage
 * widths with nothing to measure.
 */
export const ImpostorRevealList: React.FC<ImpostorRevealListProps> = ({
  impostors,
  hostId,
}) => (
  <div
    className="grid w-full grid-cols-1 gap-2.5 p-1 sm:grid-cols-2"
    data-testid="impostor-reveal-list"
  >
    {impostors.map((player, index) => (
      <ImpostorPlayerCard
        key={player.id}
        player={player}
        hostId={hostId}
        index={index}
        total={impostors.length}
      />
    ))}
  </div>
);
