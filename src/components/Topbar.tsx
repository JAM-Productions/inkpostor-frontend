import { useGameStore } from "../store/gameState";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { EndGameButton } from "./buttons/EndGameButton";
import { ExitGameButton } from "./buttons/ExitGameButton";
import { RoomCodeButton } from "./buttons/RoomCodeButton";
import { ReturnHomeButton } from "./buttons/ReturnHomeButton";
import { SoundToggleButton } from "./buttons/SoundToggleButton";

export function Topbar() {
  const phase = useGameStore((state) => state.phase);
  const roomId = useGameStore((state) => state.roomId);
  const myName = useGameStore((state) => state.myName);
  const gameEnded = useGameStore((state) => state.gameEnded);

  const isJoinScreen = !roomId || !myName;
  const showLanguageSwitcher = isJoinScreen || phase === "LOBBY";
  const showRoomCode = !isJoinScreen && phase !== "LOBBY" && !gameEnded;
  const showReturnHome = !isJoinScreen && phase === "RESULTS" && gameEnded;
  const hasVisibleControls =
    showLanguageSwitcher || showReturnHome || (!isJoinScreen && !gameEnded);

  if (!hasVisibleControls) {
    return null;
  }

  return (
    <header data-testid="topbar">
      <div
        aria-hidden="true"
        data-testid="topbar-background"
        className="fixed inset-x-0 top-0 h-16 sm:h-18 pointer-events-none z-40"
        style={{
          background:
            "linear-gradient(to bottom, rgba(38, 34, 29, 0.85) 0%, rgba(38, 34, 29, 0) 100%)",
        }}
      />
      <div className="fixed top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-3 z-50">
        <ExitGameButton />
        {showRoomCode && <RoomCodeButton roomId={roomId} />}
        <ReturnHomeButton />
      </div>
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 flex items-center justify-between gap-3 sm:gap-4 z-50">
        <EndGameButton />
        <SoundToggleButton />
        {showLanguageSwitcher && <LanguageSwitcher />}
      </div>
    </header>
  );
}
