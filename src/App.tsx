import { useEffect } from "react";
import { loadSocket, useGameStore } from "./store/gameState";
import { JoinScreen } from "./components/JoinScreen";
import { Lobby } from "./components/Lobby";
import { WordSelection } from "./components/WordSelection";
import { RoleReveal } from "./components/RoleReveal";
import { WordReveal } from "./components/WordReveal";
import { OrderInfo } from "./components/OrderInfo";
import { Canvas } from "./components/Canvas";
import { VotingScreen } from "./components/VotingScreen";
import { ImpostorFinalGuess } from "./components/ImpostorFinalGuess";
import { GameResult } from "./components/GameResult";
import { Topbar } from "./components/Topbar";
import { ModalRenderer } from "./components/modals/ModalRenderer";
import { useGameSounds } from "./hooks/useGameSounds";
import { useGameMusic } from "./hooks/useGameMusic";
import { initAudioListeners } from "./lib/sound";

// App orchestrates the current phase of the game
function App() {
  const phase = useGameStore((state) => state.phase);
  const roomId = useGameStore((state) => state.roomId);
  const myName = useGameStore((state) => state.myName);

  useGameSounds();
  useGameMusic();

  useEffect(() => {
    return initAudioListeners();
  }, []);

  const isJoinScreen = !roomId || !myName;

  // socket.io is needed the moment anyone joins a room, so it starts
  // downloading while the player is still typing their name: off the
  // render-blocking path, but warm before the click that needs it.
  useEffect(() => {
    void loadSocket().catch(() => {});
  }, []);

  // Switch between game screens depending on current state of the room
  const renderPhase = () => {
    if (isJoinScreen) {
      return <JoinScreen />;
    }

    switch (phase) {
      case "LOBBY":
        return <Lobby />;
      case "WORD_SELECTION":
        return <WordSelection />;
      case "ROLE_REVEAL":
        return <RoleReveal />;
      case "WORD_REVEAL":
        return <WordReveal />;
      case "ORDER_INFO":
        return <OrderInfo />;
      case "DRAWING":
        return <Canvas />;
      case "VOTING":
        return <VotingScreen />;
      case "IMPOSTOR_GUESS":
        return <ImpostorFinalGuess />;
      case "RESULTS":
        return <GameResult />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-400">
            Unknown Game Phase: {phase}
          </div>
        );
    }
  };

  return (
    <>
      <Topbar />
      {renderPhase()}
      <ModalRenderer />
    </>
  );
}

export default App;
