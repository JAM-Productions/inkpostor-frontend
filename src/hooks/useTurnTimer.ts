import { useEffect, useState } from "react";
import { useGameStore } from "../store/gameState";

/**
 * Counts down the remaining time for the current drawing turn.
 *
 * The countdown restarts whenever the active player changes and, when the local
 * player owns the turn, the turn is ended automatically once the time runs out.
 *
 * @returns The remaining turn time in milliseconds.
 */
export const useTurnTimer = (): number => {
  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const myId = useGameStore((state) => state.myId);
  const gameOptions = useGameStore((state) => state.gameOptions);
  const actions = useGameStore((state) => state.actions);

  const roundTimeMs = gameOptions.roundTime * 1000;
  const isMyTurn = currentTurnPlayerId === myId;

  const [timeLeft, setTimeLeft] = useState(roundTimeMs);

  useEffect(() => {
    if (!currentTurnPlayerId) return;

    setTimeLeft(roundTimeMs);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          if (isMyTurn) {
            actions.endTurn();
          }
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentTurnPlayerId, isMyTurn, actions, roundTimeMs]);

  return timeLeft;
};
