import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Users } from "lucide-react";
import { useGameStore, type Player } from "../../store/gameState";
import { useClickOutside } from "../../hooks/useClickOutside";
import { getPlayerIconColorClass } from "../../lib/playerColors";
import { VoteKickButton } from "../buttons/VoteKickButton";

/**
 * "Players" button shown in the topbar during the DRAWING phase. Opens a popover
 * listing the other players so the local player can mark them as suspects or
 * vote to kick them.
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
    <div className="relative" ref={suspectsRef}>
      <button
        type="button"
        onClick={() => setIsSusListOpen(!isSusListOpen)}
        className={`flex items-center justify-center gap-2 py-2.5 md:py-1.5 px-2.5 md:px-3 rounded-[14px_4px_16px_5px] font-handwritten font-bold  transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] shadow-[3px_3px_0px_#0c0b09] cursor-pointer border-2 border-stone-950 ${
          isSusListOpen
            ? "bg-amber-400 text-stone-950 -rotate-1"
            : "bg-ink-surface text-amber-200 hover:bg-stone-800"
        }`}
        aria-label={t("canvas.players")}
      >
        <Users
          className={`size-4 text-amber-400 ${isSusListOpen ? "text-stone-950" : ""}`}
        />
        <span className="hidden md:inline">{t("canvas.players")}</span>
      </button>

      {isSusListOpen && (
        <div className="fixed top-16 right-3 sm:absolute sm:top-full sm:right-0 sm:mt-3 p-3.5 bg-ink-surface rounded-[20px_6px_22px_7px] border-3 border-stone-950 shadow-[6px_6px_0px_#0c0b09] flex flex-col gap-2 min-w-60 animate-slide-pop-in z-50">
          <div className="text-sm font-handwritten font-bold text-amber-300 uppercase tracking-wider mb-1 px-1">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-[14px_4px_16px_5px] border-2 border-stone-950 transition-colors flex-1 text-left ${
                  player.isEjected
                    ? "bg-[#181512]/50 opacity-50 cursor-default"
                    : player.isSuspected
                      ? "bg-red-950/80 text-red-400 border-red-500 shadow-[2px_2px_0px_#000] cursor-pointer"
                      : "bg-[#181512] hover:bg-stone-800 text-amber-100 shadow-[2px_2px_0px_#000] cursor-pointer"
                }`}
              >
                <div
                  className={`size-8 shrink-0 rounded-full border-2 border-stone-950 flex items-center justify-center text-xs font-bold uppercase shadow-sm ${player.id === currentTurnPlayerId ? "animate-pulse" : ""} ${getPlayerIconColorClass(
                    player.id,
                    hostId,
                    players,
                  )}`}
                >
                  {player.name.charAt(0)}
                </div>
                <span className="font-handwritten font-bold flex-1 truncate text-base">
                  {player.name}
                </span>
                {player.id !== myId && !player.isEjected && (
                  <div
                    className={`size-6 rounded-full border-2 border-stone-950 flex items-center justify-center transition-colors ${
                      player.isSuspected
                        ? "bg-red-500 text-stone-950"
                        : "bg-ink-surface text-transparent"
                    }`}
                  >
                    {player.isSuspected && (
                      <Search className="size-3.5 stroke-3" />
                    )}
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
