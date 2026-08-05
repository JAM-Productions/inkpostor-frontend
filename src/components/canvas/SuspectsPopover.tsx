import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Users } from "lucide-react";
import { useGameStore, type Player } from "../../store/gameState";
import { useClickOutside } from "../../hooks/useClickOutside";
import { getPlayerIconColorClass } from "../../lib/playerColors";
import { VoteKickButton } from "../buttons/VoteKickButton";

/**
 * "Players" button shown in the canvas header. Opens a popover listing the other
 * players so the local player can mark them as suspects or vote to kick them.
 *
 * Renders nothing while it is the local player's own turn.
 */
export const SuspectsPopover: React.FC = () => {
  const { t } = useTranslation();
  const [isSusListOpen, setIsSusListOpen] = useState(false);
  const suspectsRef = useRef<HTMLDivElement>(null);

  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const players = useGameStore((state) => state.players);
  const actions = useGameStore((state) => state.actions);

  const isMyTurn = currentTurnPlayerId === myId;
  const suspectedPlayers = players.filter((p) => p.id !== myId);

  const getRequiredVotes = (targetPlayer: Player) => {
    const activePlayers = players.filter((p) => p.isConnected);

    if (!targetPlayer.isConnected) {
      return activePlayers.length;
    }

    return Math.max(1, activePlayers.length - 1);
  };

  useClickOutside(suspectsRef, isSusListOpen, setIsSusListOpen);

  if (isMyTurn) return null;

  return (
    <div className="sm:relative" ref={suspectsRef}>
      <button
        type="button"
        onClick={() => setIsSusListOpen(!isSusListOpen)}
        className={`flex items-center justify-center gap-2 p-2.5 sm:px-5 sm:py-3 rounded-xl font-bold transition-[background-color,border-color,transform] active:scale-95 shadow-lg shadow-stone-900/50 cursor-pointer ${
          isSusListOpen
            ? "bg-stone-600 text-white border-2 border-stone-500"
            : "bg-surface text-stone-300 hover:bg-stone-700 hover:text-white border-2 border-transparent"
        }`}
        aria-label={t("canvas.players")}
      >
        <Users className="size-5" />
        <span className="hidden md:inline">{t("canvas.players")}</span>
      </button>

      {isSusListOpen && (
        <div className="absolute top-full inset-x-0 sm:inset-x-auto sm:left-auto sm:right-0 mt-3 p-3 bg-stone-800 rounded-2xl border border-stone-700 shadow-2xl flex flex-col gap-2 sm:min-w-[240px] animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-200 z-50">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 px-1">
            {t("canvas.suspects")}
          </div>
          {suspectedPlayers.map((player) => (
            <div key={player.id} className="flex gap-1 w-full">
              <button
                type="button"
                onClick={() => {
                  if (player.id !== myId && !player.isEjected)
                    actions.toggleSus(player.id);
                }}
                disabled={player.id === myId || player.isEjected}
                title={player.name}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-[background-color,border-color,transform] flex-1 text-left ${
                  player.isEjected
                    ? "bg-stone-900/50 opacity-50 cursor-default"
                    : player.isSuspected
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 cursor-pointer"
                      : "bg-stone-900/50 hover:bg-stone-700 text-stone-200 cursor-pointer"
                }`}
              >
                <div
                  className={`size-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-sm ${player.id === currentTurnPlayerId ? "animate-pulse" : ""} ${getPlayerIconColorClass(
                    player.id,
                    hostId,
                    players,
                  )}`}
                >
                  {player.name.charAt(0)}
                </div>
                <span className="font-semibold flex-1 truncate text-sm">
                  {player.name}
                </span>
                {player.id !== myId && !player.isEjected && (
                  <div
                    className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      player.isSuspected
                        ? "border-red-500 bg-red-500/20 text-red-500"
                        : "border-stone-600 text-transparent group-hover:border-stone-400"
                    }`}
                  >
                    {player.isSuspected && <Search className="size-3" />}
                  </div>
                )}
              </button>
              <VoteKickButton
                player={player}
                requiredVotes={getRequiredVotes(player)}
                onAction={() => setIsSusListOpen(false)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
