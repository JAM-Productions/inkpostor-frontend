import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  Crown,
  LoaderCircle,
  Minus,
  Unplug,
  UserMinus,
  X,
} from "lucide-react";
import { getPlayerIconColorClass } from "../lib/playerColors";
import { useGameStore, type Player } from "../store/gameState";
import { useClickOutside } from "../hooks/useClickOutside";

interface LobbyPlayerCardProps {
  player: Player;
  hostId: string | null;
  myId: string | null;
  isHost: boolean;
  index?: number;
}

export const LobbyPlayerCard: React.FC<LobbyPlayerCardProps> = ({
  player,
  hostId,
  myId,
  isHost,
  index = 0,
}) => {
  const { t } = useTranslation();
  const players = useGameStore((state) => state.players);
  const actions = useGameStore((state) => state.actions);
  const [isPendingKick, setIsPendingKick] = useState(false);

  const handleKickConfirm = () => {
    actions.kickPlayer(player.id);
    setIsPendingKick(false);
  };

  const pendingKickRef = useRef<HTMLDivElement>(null);

  useClickOutside(pendingKickRef, isPendingKick, setIsPendingKick);

  return (
    <div
      style={{ animationDelay: `${index * 100}ms` }}
      className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border animate-fade-in-right ${player.id === myId ? "bg-white/20 border-white/40" : "bg-stone-900 border-stone-700/50"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`size-8 sm:size-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg ${getPlayerIconColorClass(player.id, hostId, players)}`}
        >
          {player.isConnected === false ? (
            <LoaderCircle className="size-4 sm:size-5 text-white animate-spin opacity-60" />
          ) : (
            player.name.charAt(0).toUpperCase()
          )}
        </div>
        <div
          className={`flex items-center gap-2 ${player.isConnected === false ? "animate-pulse" : ""}`}
        >
          <span className="font-semibold text-white text-sm sm:text-lg">
            {player.name}
          </span>
          {player.isConnected === false && (
            <Unplug
              className="size-4 text-white/80"
              aria-label={t("lobby.disconnectedAria", { name: player.name })}
            />
          )}
        </div>
      </div>

      {player.id === hostId && (
        <div className="flex items-center text-amber-500 gap-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
          <Crown className="size-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("lobby.host")}
          </span>
        </div>
      )}

      {isHost && player.id !== hostId && (
        <div className="ml-2" ref={pendingKickRef}>
          {isPendingKick ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleKickConfirm}
                className="inline-flex size-8 items-center justify-center rounded-full border border-green-500/40 bg-green-500/10 text-green-400 transition-colors hover:bg-green-500/20 cursor-pointer animate-fade-in-left animate-duration-fast"
                aria-label={t("lobby.confirmKickAria", {
                  name: player.name,
                })}
              >
                <Check className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsPendingKick(false)}
                className="inline-flex size-8 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 cursor-pointer"
                aria-label={t("lobby.cancelKickAria", {
                  name: player.name,
                })}
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsPendingKick(true)}
              className="group relative inline-flex size-8 items-center justify-center rounded-full border border-stone-600 bg-stone-800 text-stone-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
              aria-label={t("lobby.kickPlayerAria", {
                name: player.name,
              })}
            >
              <Minus className="size-3 transition-opacity group-hover:opacity-0" />
              <UserMinus className="absolute size-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
