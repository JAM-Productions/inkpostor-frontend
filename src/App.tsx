import { useGameStore } from "./store/gameState";
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
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { EndGameButton } from "./components/buttons/EndGameButton";
import { ExitGameButton } from "./components/buttons/ExitGameButton";
import { ModalRenderer } from "./components/modals/ModalRenderer";

// App orchestrates the current phase of the game
function App() {
  const phase = useGameStore((state) => state.phase);
  const roomId = useGameStore((state) => state.roomId);
  const myName = useGameStore((state) => state.myName);

  const isJoinScreen = !roomId || !myName;
  const showLanguageSwitcher = isJoinScreen || phase === "LOBBY";

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
      <ExitGameButton />
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 flex items-center justify-between gap-3 sm:gap-4 z-50">
        <EndGameButton />
        {showLanguageSwitcher && <LanguageSwitcher />}
      </div>
      {renderPhase()}
      <ModalRenderer />
    </>
  );
}

export default App;
