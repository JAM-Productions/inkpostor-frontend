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
      className={`flex items-center justify-between p-3.5 sm:p-4 rounded-[18px_6px_20px_8px] border-2 transition-colors animate-fade-in-right ${
        player.id === myId
          ? "bg-white/20 border-white/40 shadow-[3px_3px_0px_#000]"
          : "bg-[#181512] border-stone-800 shadow-[2px_2px_0px_#000]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`size-9 sm:size-11 rounded-full flex items-center justify-center font-bold text-base sm:text-xl border-2 border-stone-950 shadow-[2px_2px_0px_#000] ${getPlayerIconColorClass(player.id, hostId, players)}`}
        >
          {player.isConnected === false ? (
            <LoaderCircle className="size-5 sm:size-6 text-white animate-spin opacity-80" />
          ) : (
            player.name.charAt(0).toUpperCase()
          )}
        </div>
        <div
          className={`flex items-center gap-2 ${player.isConnected === false ? "animate-pulse opacity-60" : ""}`}
        >
          <span className="font-handwritten font-bold text-white text-lg sm:text-xl tracking-wide">
            {player.name}
          </span>
          {player.isConnected === false && (
            <Unplug
              className="size-4 text-amber-400"
              aria-label={t("lobby.disconnectedAria", { name: player.name })}
            />
          )}
        </div>
      </div>

      {player.id === hostId && (
        <div className="flex items-center text-amber-300 gap-1.5 bg-amber-950/60 px-3 py-1 rounded-[12px_4px_14px_5px] border-2 border-amber-400/50 shadow-[2px_2px_0px_#000]">
          <Crown className="size-4 text-amber-400" />
          <span className="text-xs font-handwritten font-bold uppercase tracking-wider">
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
                data-testid={`confirm-lobby-kick-btn-${player.id}`}
                onClick={handleKickConfirm}
                className="inline-flex size-8 items-center justify-center rounded-full border-2 border-green-500 bg-green-950/80 text-green-300 transition-transform hover:scale-105 cursor-pointer animate-fade-in-left animate-duration-fast shadow-[2px_2px_0px_#000]"
                aria-label={t("lobby.confirmKickAria", {
                  name: player.name,
                })}
              >
                <Check className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsPendingKick(false)}
                className="inline-flex size-8 items-center justify-center rounded-full border-2 border-red-500 bg-red-950/80 text-red-300 transition-transform hover:scale-105 cursor-pointer shadow-[2px_2px_0px_#000]"
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
              data-testid={`lobby-kick-btn-${player.id}`}
              onClick={() => setIsPendingKick(true)}
              className="group relative inline-flex size-8 items-center justify-center rounded-full border-2 border-stone-700 bg-ink-surface text-stone-300 transition-colors hover:border-red-500 hover:bg-red-950/60 hover:text-red-300 cursor-pointer shadow-[2px_2px_0px_#000]"
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
