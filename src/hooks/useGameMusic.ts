import { useEffect } from "react";
import type { MusicTrack } from "../lib/sound";
import { useGameStore, type GamePhase } from "../store/gameState";
import { useSoundStore } from "../store/soundStore";

/**
 * Which bed belongs to which phase.
 *
 * The lobby is the only screen a player sits idle on, so it is the only one
 * with a tune. Everything else in play gets the tension bed — including the
 * reveal screens, which last seconds and would only make the music stutter if
 * they had a bed of their own.
 *
 * The results screen is the one that depends on more than the phase: a round
 * result the game carries on from keeps the tension up, while the end of the
 * game falls silent so the victory, defeat and stalemate stings have the room
 * to themselves.
 */
export function trackForPhase(
  phase: GamePhase,
  gameEnded: boolean,
): MusicTrack | null {
  if (phase === "LOBBY") return "lobby";
  if (phase === "RESULTS" && gameEnded) return null;
  return "tension";
}

/** Keeps the background music in step with the phase of the game. */
export function useGameMusic(): void {
  const phase = useGameStore((state) => state.phase);
  const gameEnded = useGameStore((state) => state.gameEnded);
  const roomId = useGameStore((state) => state.roomId);
  const myName = useGameStore((state) => state.myName);
  const setMusicTrack = useSoundStore((state) => state.actions.setMusicTrack);

  // Nobody is in a room on the join screen, and the phase still reads LOBBY
  // there, so the bed waits until the player is actually inside one.
  const isInRoom = !!roomId && !!myName;

  useEffect(() => {
    setMusicTrack(isInRoom ? trackForPhase(phase, gameEnded) : null);
  }, [phase, gameEnded, isInRoom, setMusicTrack]);

  // Leaving the page or the room must not leave a bed playing behind it
  useEffect(() => () => setMusicTrack(null), [setMusicTrack]);
}
