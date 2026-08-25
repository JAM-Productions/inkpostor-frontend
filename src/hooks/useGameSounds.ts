import { useEffect, useRef } from "react";
import { isSpokenMode } from "../lib/constants";
import {
  areAllImpostorsDefeated,
  resolveImpostorIds,
} from "../lib/gameOutcome";
import { useGameStore } from "../store/gameState";
import { useSoundStore } from "../store/soundStore";

/**
 * Hook that listens to reactive game state updates and triggers sound effects.
 */
export function useGameSounds(): void {
  const phase = useGameStore((state) => state.phase);
  const players = useGameStore((state) => state.players);
  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const myId = useGameStore((state) => state.myId);
  const amIImpostor = useGameStore((state) => state.amIImpostor);
  const gameEnded = useGameStore((state) => state.gameEnded);
  const endedByHost = useGameStore((state) => state.endedByHost);
  const gameMode = useGameStore((state) => state.gameMode);
  // Optional: this hook mounts with the app, ahead of any room state.
  const virtualVotingEnabled = useGameStore(
    (state) => state.gameOptions?.virtualVotingEnabled,
  );
  const ejectedId = useGameStore((state) => state.ejectedId);
  const impostorId = useGameStore((state) => state.impostorId);
  const impostorIds = useGameStore((state) => state.impostorIds);
  const impostorGuessedCorrectly = useGameStore(
    (state) => state.impostorGuessedCorrectly,
  );
  const impostorOutOfGuesses = useGameStore(
    (state) => state.impostorOutOfGuesses,
  );
  const playSound = useSoundStore((state) => state.actions.playSound);

  const playerCount = players?.length || 0;
  // Counted rather than tested: the flag stays up for the rest of the match, so
  // only a rise in the count marks a meeting actually being called. The server
  // raises it in the same update that moves the room to VOTING, which is why
  // the phase effect below can tell the two kinds of vote apart.
  const emergencyCount =
    players?.filter((p) => p.hasStartedEmergencyVoting).length || 0;

  const prevPhaseRef = useRef(phase);
  const prevPlayerCountRef = useRef(playerCount);
  const prevEmergencyCountRef = useRef(emergencyCount);
  const prevTurnPlayerRef = useRef(currentTurnPlayerId);
  const prevGuessedCorrectlyRef = useRef(impostorGuessedCorrectly);
  const prevOutOfGuessesRef = useRef(impostorOutOfGuesses);

  // Player joined in lobby sound
  useEffect(() => {
    if (phase === "LOBBY") {
      if (
        prevPlayerCountRef.current > 0 &&
        playerCount > prevPlayerCountRef.current
      ) {
        playSound("playerJoin");
      }
    }
    prevPlayerCountRef.current = playerCount;
  }, [phase, playerCount, playSound]);

  // Turn start notification sound when it becomes my turn
  useEffect(() => {
    if (
      phase === "DRAWING" &&
      currentTurnPlayerId &&
      currentTurnPlayerId === myId &&
      prevTurnPlayerRef.current !== currentTurnPlayerId
    ) {
      playSound("turnAlert");
    }
    prevTurnPlayerRef.current = currentTurnPlayerId;
  }, [phase, currentTurnPlayerId, myId, playSound]);

  // Guess results audio
  useEffect(() => {
    if (impostorGuessedCorrectly && !prevGuessedCorrectlyRef.current) {
      playSound("impostorGuessCorrect");
    }
    prevGuessedCorrectlyRef.current = impostorGuessedCorrectly;
  }, [impostorGuessedCorrectly, playSound]);

  useEffect(() => {
    if (impostorOutOfGuesses && !prevOutOfGuessesRef.current) {
      playSound("impostorGuessWrong");
    }
    prevOutOfGuessesRef.current = impostorOutOfGuesses;
  }, [impostorOutOfGuesses, playSound]);

  // Phase transition sounds
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    if (prevPhase !== phase) {
      if (
        (phase === "WORD_SELECTION" || phase === "ROLE_REVEAL") &&
        prevPhase === "LOBBY"
      ) {
        playSound("gameStart");
      } else if (phase === "VOTING") {
        // An emergency meeting announces itself with the bell; the vote that
        // simply follows the drawing round gets the suspense pulse instead.
        const isEmergency = emergencyCount > prevEmergencyCountRef.current;
        playSound(isEmergency ? "emergencyAlert" : "heartbeat");
      } else if (phase === "RESULTS") {
        if (gameEnded) {
          // A game the host closed (or a spoken round that was simply revealed)
          // ends in neither a victory nor a defeat, so it gets its own sound.
          const isRevealOnly =
            endedByHost || (isSpokenMode(gameMode) && !virtualVotingEnabled);

          if (isRevealOnly) {
            playSound("stalemate");
          } else {
            const impostorIdSet = resolveImpostorIds(impostorIds, impostorId);
            const crewWon = areAllImpostorsDefeated({
              players,
              impostorIdSet,
              ejectedId,
              impostorGuessedCorrectly,
              impostorOutOfGuesses,
            });
            // The roles come revealed with the final state, so they are a surer
            // answer than `amIImpostor`, which is only kept as the fallback.
            const wasIImpostor =
              impostorIdSet.size > 0 && myId
                ? impostorIdSet.has(myId)
                : Boolean(amIImpostor);
            const iWon = wasIImpostor ? !crewWon : crewWon;

            playSound(iWon ? "victory" : "defeat");
          }
        } else if (ejectedId) {
          playSound("playerEjected");
        } else {
          // Nobody was ejected and the game goes on: nothing is settled.
          playSound("suspense");
        }
      }
      prevEmergencyCountRef.current = emergencyCount;
    }
    prevPhaseRef.current = phase;
    // Outside a phase change the marker only ever follows the count *down* — a
    // player with the flag leaving, or a new match resetting it. It must not
    // follow it up, because the client that calls the meeting raises its own
    // flag optimistically a beat before the phase change it announces, and
    // moving the marker then would swallow the very rise being watched for.
    if (emergencyCount < prevEmergencyCountRef.current) {
      prevEmergencyCountRef.current = emergencyCount;
    }
  }, [
    phase,
    emergencyCount,
    gameEnded,
    endedByHost,
    gameMode,
    virtualVotingEnabled,
    ejectedId,
    impostorId,
    impostorIds,
    players,
    myId,
    impostorGuessedCorrectly,
    impostorOutOfGuesses,
    amIImpostor,
    playSound,
  ]);
}
