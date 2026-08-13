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
      className={`relative flex items-center justify-between p-3.5 sm:p-4 min-h-21.5 rounded-[22px_7px_20px_8px] border-3 border-stone-950 shadow-[5px_5px_0px_#0c0b09] ${getActivePlayerCardColorClass(isMyTurn ? myId : null, hostId, players)}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div
            className={`size-12 sm:size-13 rounded-full flex items-center justify-center font-handwritten font-extrabold text-2xl uppercase text-white border-2 border-stone-950 shadow-[2px_2px_0px_#000] ${getPlayerIconColorClass(currentTurnPlayerId, hostId, players)} ${isMyTurn ? "animate-pulse" : ""}`}
          >
            {activePlayer?.isConnected !== false
              ? activePlayer?.name.charAt(0) || "?"
              : null}
          </div>
          {activePlayer?.isConnected === false && (
            <div className="absolute inset-0 size-12 sm:size-13 rounded-full bg-black/60 flex items-center justify-center border-2 border-stone-950">
              <LoaderCircle className="size-6 text-white animate-spin opacity-80" />
            </div>
          )}
        </div>
        {isMyTurn ? (
          <div className="animate-pulse">
            <p className="text-xl sm:text-3xl font-handwritten font-extrabold text-white uppercase tracking-wider drop-shadow-sm">
              {t("canvas.yourTurn")}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p
              className={`text-xs sm:text-sm font-handwritten font-bold text-amber-200/80 uppercase tracking-widest truncate ${activePlayer?.isConnected ? "" : "animate-pulse"}`}
            >
              {activePlayer?.isConnected
                ? t("canvas.nowDrawing")
                : t("canvas.notConnected")}
            </p>
            <h2 className="text-xl sm:text-2xl font-handwritten font-bold text-white truncate">
              {activePlayer?.name || t("canvas.someone")}
            </h2>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-5 shrink-0">
        <div className="flex items-center gap-1.5">
          <ImpostorGuessControl />
          <SuspectsPopover />
          {/* Alert Dropdown */}
          {!isMyTurn && <EmergencyAlertButton />}
        </div>
        <div
          className={`flex flex-col items-end ${isMyTurn ? "hidden sm:flex" : "block sm:flex"}`}
        >
          <p className="text-xs font-handwritten text-amber-200/80 font-bold uppercase mb-1 flex items-center gap-1">
            <Clock className="size-3.5 text-amber-400" /> {t("canvas.time")}
          </p>
          <div className="text-2xl font-short-stack font-black text-white px-3 py-1 bg-[#181512] rounded-[12px_4px_14px_4px] border-2 border-stone-950 shadow-[2px_2px_0px_#000] min-w-[86px] text-right tabular-nums">
            {(timeLeft / 1000).toFixed(1)}s
          </div>
        </div>

        {isMyTurn && (
          <button
            type="button"
            onClick={() => actions.endTurn()}
            className="bg-amber-300 hover:bg-amber-200 text-stone-950 border-3 border-stone-950 px-5 py-3 rounded-[16px_5px_18px_6px] font-handwritten font-bold text-xl transition-all hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] shadow-[4px_4px_0px_#0c0b09] cursor-pointer flex items-center gap-2"
          >
            <CheckSquare className="size-6 text-stone-950" />
            <span>{t("canvas.done")}</span>
          </button>
        )}
      </div>
    </div>
  );
};
