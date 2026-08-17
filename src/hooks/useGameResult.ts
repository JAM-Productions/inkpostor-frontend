import React from "react";
import { useTranslation } from "react-i18next";
import { isSpokenMode } from "../lib/constants";
import { useGameStore, type Player } from "../store/gameState";

/**
 * Everything the results screen needs to decide what it is looking at. The
 * screen has three shapes — a reveal, a verdict and a round result — and this is
 * where the room state is turned into the handful of answers that pick one of
 * them (see docs/GAME_RESULT.md).
 */
export interface GameResultState {
  /** The game is over, as opposed to a round result the game continues from. */
  isGameOver: boolean;
  /**
   * The game was closed instead of played out: the host ended it, or the spoken
   * round was revealed. Nobody won, so the screen reveals the impostors instead
   * of announcing a winner. The mode check is the fallback for a server that
   * doesn't report `endedByHost` yet.
   */
  isRevealOnly: boolean;
  /** Whether the crewmates took it, which is what tints the panel. */
  allImpostorsDefeated: boolean;
  /** Every impostor of the game, ejected or kicked ones included. */
  impostorPlayers: Player[];
  /** Their names, joined — what the lines about the team interpolate. */
  impostorNames: string;
  /**
   * Whether the game was dealt more than one impostor. Counted from the ids the
   * room reports rather than from the cards, so it stays true even if one of
   * them cannot be named.
   */
  severalImpostors: boolean;
  /** The player the vote (or a kick) put out, if the screen can name them. */
  ejectedPlayer: Player | undefined;
  ejectedName: string | undefined;
  /** Whether that player turned out to be an impostor. */
  isEjectedImpostor: boolean;
  /** How many impostors are still in play, counted by the server. */
  remainingImpostorCount: number;
  /** "X was the Inkpostor!" / "The Inkpostors were X, Y!" */
  impostorsWereLine: string;
  /** Who made the guess that ended the game, when one did. */
  guessingImpostorName: string;
  impostorGuessedCorrectly: boolean;
  impostorOutOfGuesses: boolean;
  secretWord: string | null;
  players: Player[];
  hostId: string | null;
  isHost: boolean;
  /** Whether this player has already asked for the next round. */
  hasConfirmedNewRound: boolean;
  /** Whether this player is out of the game, so no round can be asked for. */
  amIEjected: boolean;
}

export function useGameResult(): GameResultState {
  const { t } = useTranslation();
  const impostorId = useGameStore((state) => state.impostorId);
  const rawImpostorIds = useGameStore((state) => state.impostorIds);
  const roomPlayers = useGameStore((state) => state.players);
  const kickedOutPlayers = useGameStore((state) => state.kickedOutPlayers);
  const secretWord = useGameStore((state) => state.secretWord);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const ejectedId = useGameStore((state) => state.ejectedId);
  const gameEnded = useGameStore((state) => state.gameEnded);
  const endedByHost = useGameStore((state) => state.endedByHost);
  const impostorGuessedCorrectly = useGameStore(
    (state) => state.impostorGuessedCorrectly,
  );
  const impostorOutOfGuesses = useGameStore(
    (state) => state.impostorOutOfGuesses,
  );
  const guessingImpostorId = useGameStore((state) => state.guessingImpostorId);
  const ejectedWasImpostorState = useGameStore(
    (state) => state.ejectedWasImpostor,
  );
  const remainingImpostorCountState = useGameStore(
    (state) => state.remainingImpostorCount,
  );
  const gameMode = useGameStore((state) => state.gameMode);
  const virtualVotingEnabled = useGameStore(
    (state) => state.gameOptions.virtualVotingEnabled,
  );

  const impostorIdSet = React.useMemo(() => {
    const list =
      rawImpostorIds && rawImpostorIds.length > 0
        ? rawImpostorIds
        : impostorId
          ? [impostorId]
          : [];
    return new Set(list);
  }, [rawImpostorIds, impostorId]);

  // A vote-kick takes its target out of the room, and that target may well be
  // an impostor this screen has to name — a game with several of them keeps
  // running after one is kicked. The server keeps who they were, so they are put
  // back for display only, ejected, so nothing counts them as still playing.
  const players: Player[] = React.useMemo(() => {
    const list = roomPlayers || [];
    const missing = (kickedOutPlayers ?? []).filter(
      (kicked) => !list.some((p) => p.id === kicked.id),
    );
    if (missing.length === 0) return list;
    return [
      ...list,
      ...missing.map((kicked) => ({
        ...kicked,
        isConnected: false,
        isEjected: true,
        score: 0,
        hasStartedEmergencyVoting: false,
      })),
    ];
  }, [roomPlayers, kickedOutPlayers]);

  const me = players.find((p) => p.id === myId);
  const impostorPlayers = players.filter((p) => impostorIdSet.has(p.id));
  const activeImpostors = players.filter(
    (p) => impostorIdSet.has(p.id) && !p.isEjected && p.id !== ejectedId,
  );

  const impostorNames =
    impostorPlayers.map((p) => p.name).join(", ") || "Unknown";
  // The guess that ended the game belongs to one impostor, not to the team: the
  // cards reveal everyone, but the line about it names whoever made the play. A
  // server that doesn't report it falls back to naming them all.
  const guessingImpostorName =
    players.find((p) => p.id === guessingImpostorId)?.name ?? impostorNames;

  // A vote-kick that ends the game takes the kicked player out of the room, so
  // an id alone is not enough: every branch keys off the player it resolves to,
  // and an ejection nobody can be shown falls back to revealing the impostors.
  const ejectedPlayer = players.find((p) => p.id === ejectedId);

  return {
    isGameOver: gameEnded,
    isRevealOnly:
      endedByHost || (isSpokenMode(gameMode) && !virtualVotingEnabled),
    // Crewmates win if every impostor is eliminated or out of guesses (and no
    // correct guess). Only read once the game is over, which is also the only
    // moment the impostors are known at all.
    allImpostorsDefeated:
      (activeImpostors.length === 0 || impostorOutOfGuesses) &&
      !impostorGuessedCorrectly,
    impostorPlayers,
    impostorNames,
    severalImpostors: impostorIdSet.size > 1,
    ejectedPlayer,
    ejectedName: ejectedPlayer?.name,
    isEjectedImpostor:
      ejectedWasImpostorState ??
      (ejectedId ? impostorIdSet.has(ejectedId) : false),
    // The server counts them for this screen: the impostors are still secret
    // while the game runs, so the client cannot.
    remainingImpostorCount: remainingImpostorCountState ?? 0,
    impostorsWereLine:
      impostorIdSet.size > 1
        ? t("result.wereImpostors", { names: impostorNames })
        : t("result.wasImpostor", { name: impostorNames }),
    guessingImpostorName,
    impostorGuessedCorrectly,
    impostorOutOfGuesses,
    secretWord,
    players,
    hostId,
    isHost: myId === hostId,
    hasConfirmedNewRound: !!me?.hasConfirmedNewRound,
    amIEjected: !!me?.isEjected,
  };
}
