import { useGameStore } from "./store/gameState";
import { JoinScreen } from "./components/JoinScreen";
import { Lobby } from "./components/Lobby";
import { RoleReveal } from "./components/RoleReveal";
import { Canvas } from "./components/Canvas";
import { VotingScreen } from "./components/VotingScreen";
import { GameResult } from "./components/GameResult";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

// App orchestrates the current phase of the game
function App() {
  const phase = useGameStore((state) => state.phase);
  const roomId = useGameStore((state) => state.roomId);
  const myName = useGameStore((state) => state.myName);

  // Switch between game screens depending on current state of the room
  const renderPhase = () => {
    if (!roomId || !myName) {
      return <JoinScreen />;
    }

    switch (phase) {
      case "LOBBY":
        return <Lobby />;
      case "ROLE_REVEAL":
        return <RoleReveal />;
      case "DRAWING":
        return <Canvas />;
      case "VOTING":
        return <VotingScreen />;
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
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      {renderPhase()}
    </>
  );
}

export default App;
