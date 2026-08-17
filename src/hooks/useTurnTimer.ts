import { useEffect } from "react";
import { useGameStore } from "../store/gameState";
import { useTurnTimerStore } from "../store/turnTimerStore";

/**
 * Drives the countdown for the current drawing turn.
 *
 * The countdown restarts whenever the active player changes and, when the local
 * player owns the turn, the turn is ended automatically once the time runs out.
 *
 * The remaining time is published to {@link useTurnTimerStore} instead of being
 * returned, so a tick only re-renders the components that display the clock.
 * Mount this exactly once, from the drawing screen.
 */
export const useTurnTimer = (): void => {
  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const myId = useGameStore((state) => state.myId);
  const roundTime = useGameStore((state) => state.gameOptions.roundTime);
  const actions = useGameStore((state) => state.actions);

  const roundTimeMs = roundTime * 1000;
  const isMyTurn = currentTurnPlayerId === myId;

  useEffect(() => {
    const { setTimeLeftMs } = useTurnTimerStore.getState();

    setTimeLeftMs(roundTimeMs);
    if (!currentTurnPlayerId) return;

    const interval = setInterval(() => {
      const remaining = useTurnTimerStore.getState().timeLeftMs;

      if (remaining <= 100) {
        clearInterval(interval);
        setTimeLeftMs(0);
        if (isMyTurn) {
          actions.endTurn();
        }
        return;
      }

      setTimeLeftMs(remaining - 100);
    }, 100);

    return () => clearInterval(interval);
  }, [currentTurnPlayerId, isMyTurn, actions, roundTimeMs]);
};
