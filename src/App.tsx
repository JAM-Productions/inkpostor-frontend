import { lazy, Suspense, useEffect } from "react";
import { loadSocket, useGameStore } from "./store/gameState";
import { JoinScreen } from "./components/JoinScreen";
import { PhaseFallback } from "./components/PhaseFallback";
import { Topbar } from "./components/Topbar";
import { ModalRenderer } from "./components/modals/ModalRenderer";

// Only the join screen ships in the initial bundle; every screen behind it is
// fetched on its own. To keep a phase change from ever waiting on the network,
// the chunks are prefetched ahead of the moment they are needed: the lobby as
// soon as the app mounts, the rest once the player is actually in a room.
const loadLobby = () => import("./components/Lobby");
const loadWordSelection = () => import("./components/WordSelection");
const loadRoleReveal = () => import("./components/RoleReveal");
const loadWordReveal = () => import("./components/WordReveal");
const loadOrderInfo = () => import("./components/OrderInfo");
const loadCanvas = () => import("./components/Canvas");
const loadVotingScreen = () => import("./components/VotingScreen");
const loadImpostorFinalGuess = () => import("./components/ImpostorFinalGuess");
const loadGameResult = () => import("./components/GameResult");

const Lobby = lazy(() => loadLobby().then((m) => ({ default: m.Lobby })));
const WordSelection = lazy(() =>
  loadWordSelection().then((m) => ({ default: m.WordSelection })),
);
const RoleReveal = lazy(() =>
  loadRoleReveal().then((m) => ({ default: m.RoleReveal })),
);
const WordReveal = lazy(() =>
  loadWordReveal().then((m) => ({ default: m.WordReveal })),
);
const OrderInfo = lazy(() =>
  loadOrderInfo().then((m) => ({ default: m.OrderInfo })),
);
const Canvas = lazy(() => loadCanvas().then((m) => ({ default: m.Canvas })));
const VotingScreen = lazy(() =>
  loadVotingScreen().then((m) => ({ default: m.VotingScreen })),
);
const ImpostorFinalGuess = lazy(() =>
  loadImpostorFinalGuess().then((m) => ({ default: m.ImpostorFinalGuess })),
);
const GameResult = lazy(() =>
  loadGameResult().then((m) => ({ default: m.GameResult })),
);

// Warms every screen a running game can reach. Failures are ignored on purpose:
// this is only a head start, and Suspense still covers the real load.
const prefetchGameScreens = () => {
  void Promise.allSettled([
    loadWordSelection(),
    loadRoleReveal(),
    loadWordReveal(),
    loadOrderInfo(),
    loadCanvas(),
    loadVotingScreen(),
    loadImpostorFinalGuess(),
    loadGameResult(),
  ]);
};

// App orchestrates the current phase of the game
function App() {
  const phase = useGameStore((state) => state.phase);
  const roomId = useGameStore((state) => state.roomId);
  const myName = useGameStore((state) => state.myName);

  const isJoinScreen = !roomId || !myName;

  // The lobby is the one screen every player reaches, and socket.io is needed
  // the moment anyone joins a room. Both start downloading while the player is
  // still typing their name, so neither is on the critical path for first paint
  // nor on the one for the click that follows.
  useEffect(() => {
    void loadLobby().catch(() => {});
    void loadSocket().catch(() => {});
  }, []);

  useEffect(() => {
    if (roomId) prefetchGameScreens();
  }, [roomId]);

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
      <Suspense fallback={<PhaseFallback />}>{renderPhase()}</Suspense>
      <ModalRenderer />
    </>
  );
}

export default App;
