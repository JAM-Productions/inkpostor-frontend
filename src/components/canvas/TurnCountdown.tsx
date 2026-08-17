import { useTurnTimerStore } from "../../store/turnTimerStore";

/**
 * The remaining seconds of the current turn, as bare text.
 *
 * It renders no element of its own on purpose: the caller keeps its own styled
 * box and drops this inside it. That way the ten-times-a-second tick only ever
 * updates a text node, instead of re-rendering the drawing screen around it.
 */
export const TurnCountdown: React.FC = () => {
  const timeLeftMs = useTurnTimerStore((state) => state.timeLeftMs);

  return <>{(timeLeftMs / 1000).toFixed(1)}</>;
};
