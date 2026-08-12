import { useEffect } from "react";
import {
  DEFAULT_GAME_OPTIONS,
  getMaxImpostors,
  MIN_IMPOSTORS,
} from "../lib/constants";
import { useGameStore } from "../store/gameState";

/**
 * Brings the room's impostor count back under what the remaining players allow.
 *
 * The count the host saved outlives the players it was chosen for: pick two with
 * five in the room and one leaves, and the room still advertises two impostors
 * even though four players only allow one. The server cuts it when the game
 * starts, so nothing unfair is ever played, but until then everyone reads a
 * number the room would not honour.
 *
 * Only the host may change options, so only the host corrects them, from the
 * lobby and whether the options modal is open or not. The optimistic update in
 * `updateGameOptions` lands the clamped value straight away, which is what stops
 * this from firing twice for the same departure.
 */
export const useImpostorCountClamp = () => {
  const phase = useGameStore((state) => state.phase);
  const players = useGameStore((state) => state.players);
  const hostGameOptions = useGameStore((state) => state.hostGameOptions);
  const gameMode = useGameStore((state) => state.gameMode);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const actions = useGameStore((state) => state.actions);

  const isHost = !!myId && myId === hostId;
  const maxImpostors = getMaxImpostors(players?.length || 0);
  const savedCount = hostGameOptions.impostorCount ?? MIN_IMPOSTORS;
  const isTooMany = savedCount > maxImpostors;

  useEffect(() => {
    // Options are only editable in the lobby, and the count is only ever cut
    // here: a seat freed up is not a reason to hand out more impostors than the
    // host asked for.
    if (phase !== "LOBBY" || !isHost || !isTooMany) return;

    actions.updateGameOptions({
      gameMode,
      ...hostGameOptions,
      impostorCount: maxImpostors,
      // A single impostor has nobody to be shown, exactly as saving the modal
      // and the server's own sanitising both treat it.
      revealImpostorTeammates:
        maxImpostors > MIN_IMPOSTORS
          ? hostGameOptions.revealImpostorTeammates
          : DEFAULT_GAME_OPTIONS.revealImpostorTeammates,
    });
  }, [
    actions,
    gameMode,
    hostGameOptions,
    isHost,
    isTooMany,
    maxImpostors,
    phase,
  ]);
};
