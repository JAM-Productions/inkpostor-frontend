import { useEffect, useRef } from "react";
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
  const ejectedId = useGameStore((state) => state.ejectedId);
  const ejectedWasImpostor = useGameStore((state) => state.ejectedWasImpostor);
  const remainingImpostorCount = useGameStore(
    (state) => state.remainingImpostorCount,
  );
  const impostorGuessedCorrectly = useGameStore(
    (state) => state.impostorGuessedCorrectly,
  );
  const impostorOutOfGuesses = useGameStore(
    (state) => state.impostorOutOfGuesses,
  );
  const playSound = useSoundStore((state) => state.actions.playSound);

  const playerCount = players?.length || 0;

  const prevPhaseRef = useRef(phase);
  const prevPlayerCountRef = useRef(playerCount);
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
      } else if (phase === "RESULTS") {
        if (gameEnded) {
          const isImpostorVictory =
            Boolean(impostorGuessedCorrectly) ||
            (typeof remainingImpostorCount === "number" &&
              remainingImpostorCount > 0);

          const iWon = amIImpostor
            ? isImpostorVictory
            : !isImpostorVictory &&
              (ejectedWasImpostor || impostorOutOfGuesses);

          if (iWon) {
            playSound("victory");
          } else {
            playSound("defeat");
          }
        } else if (ejectedId) {
          playSound("playerEjected");
        }
      }
    }
    prevPhaseRef.current = phase;
  }, [
    phase,
    gameEnded,
    ejectedId,
    ejectedWasImpostor,
    remainingImpostorCount,
    impostorGuessedCorrectly,
    impostorOutOfGuesses,
    amIImpostor,
    playSound,
  ]);
}
