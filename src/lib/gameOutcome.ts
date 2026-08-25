/**
 * Who won, worked out from the room state alone.
 *
 * The server only fills in `ejectedWasImpostor` and `remainingImpostorCount`
 * while the game is *running* — once it ends it broadcasts the raw room, which
 * carries neither. Anything deciding a winner has to read the revealed impostor
 * ids instead, which is what these helpers do, so the results screen and the
 * end-of-game sound always agree.
 */

export interface OutcomePlayer {
  id: string;
  isEjected?: boolean;
}

/**
 * The impostors of the match as a set. Rooms report them as a list, with the
 * single-impostor `impostorId` as the fallback for older servers.
 */
export function resolveImpostorIds(
  impostorIds: string[] | null | undefined,
  impostorId: string | null | undefined,
): Set<string> {
  if (impostorIds && impostorIds.length > 0) return new Set(impostorIds);
  return new Set(impostorId ? [impostorId] : []);
}

export interface CrewVictoryInput {
  players: OutcomePlayer[];
  impostorIdSet: Set<string>;
  /** The player this result ejected: still in the list, not yet flagged. */
  ejectedId: string | null;
  impostorGuessedCorrectly: boolean;
  impostorOutOfGuesses: boolean;
}

/**
 * Crewmates take it when every impostor is out of the room or out of guesses,
 * and none of them guessed the word.
 */
export function areAllImpostorsDefeated({
  players,
  impostorIdSet,
  ejectedId,
  impostorGuessedCorrectly,
  impostorOutOfGuesses,
}: CrewVictoryInput): boolean {
  const activeImpostors = players.filter(
    (p) => impostorIdSet.has(p.id) && !p.isEjected && p.id !== ejectedId,
  );
  return (
    (activeImpostors.length === 0 || impostorOutOfGuesses) &&
    !impostorGuessedCorrectly
  );
}
