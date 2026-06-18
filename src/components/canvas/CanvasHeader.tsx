import { useTranslation } from "react-i18next";
import { CheckSquare, Clock, LoaderCircle } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import {
  getActivePlayerCardColorClass,
  getPlayerIconColorClass,
} from "../../lib/playerColors";
import { EmergencyAlertButton } from "../buttons/EmergencyAlertButton";
import { ImpostorGuessControl } from "./ImpostorGuessControl";
import { SuspectsPopover } from "./SuspectsPopover";

interface CanvasHeaderProps {
  /** Remaining turn time in milliseconds. */
  timeLeft: number;
}

/**
 * Banner at the top of the drawing screen. Shows whose turn it is, the per-turn
 * action buttons (guess word, suspects list, emergency alert), the countdown
 * clock and the "Done" button used by the active player to end their turn.
 */
export const CanvasHeader: React.FC<CanvasHeaderProps> = ({ timeLeft }) => {
  const { t } = useTranslation();
  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const players = useGameStore((state) => state.players);
  const actions = useGameStore((state) => state.actions);

  const isMyTurn = currentTurnPlayerId === myId;
  const activePlayer = players.find((p) => p.id === currentTurnPlayerId);

  return (
    <div
      className={`relative flex items-center justify-between p-3 sm:p-4 min-h-21.5 rounded-2xl shadow-xl ${getActivePlayerCardColorClass(isMyTurn ? myId : null, hostId, players)}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div
            className={`size-12 rounded-full flex items-center justify-center font-bold text-xl uppercase text-white shadow-lg ${getPlayerIconColorClass(currentTurnPlayerId, hostId, players)} ${isMyTurn ? "animate-pulse" : ""}`}
          >
            {activePlayer?.isConnected !== false
              ? activePlayer?.name.charAt(0) || "?"
              : null}
          </div>
          {activePlayer?.isConnected === false && (
            <div className="absolute inset-0 size-12 rounded-full bg-black/50 flex items-center justify-center">
              <LoaderCircle className="size-6 text-white animate-spin opacity-60" />
            </div>
          )}
        </div>
        {isMyTurn ? (
          <div className="animate-pulse">
            <p className="text-lg sm:text-2xl font-extrabold text-white uppercase tracking-wider">
              {t("canvas.yourTurn")}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p
              className={`text-sm font-bold text-stone-400 uppercase tracking-widest truncate ${activePlayer?.isConnected ? "" : "animate-pulse"}`}
            >
              {activePlayer?.isConnected
                ? t("canvas.nowDrawing")
                : t("canvas.notConnected")}
            </p>
            <h2 className="text-lg font-semibold text-white truncate">
              {activePlayer?.name || t("canvas.someone")}
            </h2>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-6 shrink-0">
        <div className="flex items-center gap-1">
          <ImpostorGuessControl />
          <SuspectsPopover />
          {/* Alert Dropdown */}
          {!isMyTurn && <EmergencyAlertButton />}
        </div>
        <div
          className={`flex flex-col items-end ${isMyTurn ? "hidden sm:flex" : "block sm:flex"}`}
        >
          <p className="text-xs text-stone-400 font-semibold uppercase mb-1 flex items-center gap-1">
            <Clock className="size-3" /> {t("canvas.time")}
          </p>
          <div className="text-2xl font-black text-white px-3 py-1 bg-stone-900 rounded-lg min-w-[86px] text-right tabular-nums">
            {(timeLeft / 1000).toFixed(1)}s
          </div>
        </div>

        {isMyTurn && (
          <button
            type="button"
            onClick={() => actions.endTurn()}
            className="bg-ink-secondary hover:bg-white text-black px-5 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-ink-secondary/20 cursor-pointer flex items-center gap-2"
          >
            <CheckSquare className="size-5" />
            <span>{t("canvas.done")}</span>
          </button>
        )}
      </div>
    </div>
  );
};
