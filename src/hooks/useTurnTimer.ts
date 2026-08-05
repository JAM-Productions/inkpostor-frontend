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

  const [prevPlayerId, setPrevPlayerId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(roundTimeMs);

  // Sync state during render when currentTurnPlayerId changes
  if (currentTurnPlayerId !== prevPlayerId) {
    setPrevPlayerId(currentTurnPlayerId);
    setTimeLeft(roundTimeMs);
  }

  const isTimeUp = timeLeft === 0;

  useEffect(() => {
    if (!currentTurnPlayerId || isTimeUp) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentTurnPlayerId, isTimeUp]);

  // Handle side effects when the timer reaches zero
  useEffect(() => {
    if (isTimeUp && currentTurnPlayerId && isMyTurn) {
      actions.endTurn();
    }
  }, [isTimeUp, currentTurnPlayerId, isMyTurn, actions]);

  return timeLeft;
};
