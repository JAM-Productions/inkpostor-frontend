import { useGameStore } from "./store/gameState";
import { JoinScreen } from "./components/JoinScreen";
import { Lobby } from "./components/Lobby";
import { RoleReveal } from "./components/RoleReveal";
import { Canvas } from "./components/Canvas";
import { VotingScreen } from "./components/VotingScreen";
import { GameResult } from "./components/GameResult";

// App orchestrates the current phase of the game
function App() {
  const phase = useGameStore((state) => state.phase);
  const roomId = useGameStore((state) => state.roomId);
  const myName = useGameStore((state) => state.myName);

  // If we haven't successfully joined a room or set a name, show join screen
  if (!roomId || !myName) {
    return <JoinScreen />;
  }

  // Switch between game screens depending on current state of the room
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
}

export default App;
