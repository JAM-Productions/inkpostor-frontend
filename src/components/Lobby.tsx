import React from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import { useModalStore } from "../store/modalStore";
import { Users, Loader2, HelpCircle, Settings } from "lucide-react";
import { DEFAULT_ROUND_TIME, MAX_PLAYERS, MIN_PLAYERS } from "../lib/constants";
import { LobbyPlayerCard } from "./LobbyPlayerCard";
import { CopyLinkButton } from "./buttons/CopyLinkButton";
import { CopyCodeButton } from "./buttons/CopyCodeButton";

export const Lobby: React.FC = () => {
  const { t } = useTranslation();
  const roomId = useGameStore((state) => state.roomId);
  const players = useGameStore((state) => state.players);
  const gameOptions = useGameStore((state) => state.gameOptions);
  const gameMode = useGameStore((state) => state.gameMode);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const actions = useGameStore((state) => state.actions);
  const modalActions = useModalStore((state) => state.actions);

  const isHost = myId === hostId;
  const canStart = isHost && players.length >= MIN_PLAYERS;
  const hasRoomId = !!roomId;
  const optionsChangedCount =
    Number(gameMode !== "CLASSIC") +
    Number(gameOptions.roundTime !== DEFAULT_ROUND_TIME) +
    Number(gameOptions.unlimitedInk !== false) +
    Number(gameOptions.clearCanvasEachRound !== true) +
    Number(gameOptions.impostorGuessEnabled !== false);

  return (
    <div className="flex flex-col items-center justify-center max-h-screen p-4 pb-12 pt-20 bg-stone-900">
      <div className="max-w-lg w-full space-y-4 sm:space-y-8">
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-stone-400 font-medium tracking-widest uppercase text-sm">
            {t("lobby.roomCode")}
          </h2>
          <CopyCodeButton roomId={roomId} />

          {hasRoomId && (
            <div className="pt-1">
              <CopyLinkButton roomId={roomId} />
            </div>
          )}
        </div>

        <div className="bg-stone-800 rounded-3xl p-6 shadow-xl border border-stone-700 flex flex-col max-h-[70vh]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex justify-center items-center gap-4">
              <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <Users className="text-ink-secondary size-5 sm:size-6" />
                {t("lobby.players")}
              </h3>
              <button
                type="button"
                aria-label={
                  optionsChangedCount > 0
                    ? `${t("options.open")} (${optionsChangedCount})`
                    : t("options.open")
                }
                onClick={() => modalActions.openModal("OPTIONS")}
                className="relative"
              >
                <Settings className="size-5 sm:size-5.5 text-stone-400 hover:text-stone-300 cursor-pointer" />
                {optionsChangedCount > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 block size-1 rounded-full bg-amber-400 ring-1 ring-amber-300 shadow-sm shadow-amber-300/50"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => modalActions.openModal("RULES")}
                className="flex items-center gap-2 font-bold cursor-pointer"
                data-testid="how-to-play-btn"
              >
                <HelpCircle className="size-5 sm:size-5.5 text-ink-primary hover:text-ink-primary-accent" />
              </button>
              <span className="bg-stone-700 text-stone-300 text-xs sm:text-sm font-semibold px-3 py-1 rounded-full">
                {players.length < MAX_PLAYERS ? (
                  <span>
                    {t("lobby.joined", {
                      count: players.length,
                      max: MAX_PLAYERS,
                    })}
                  </span>
                ) : (
                  <span className="text-green-400">{t("lobby.fullLobby")}</span>
                )}
              </span>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 mb-8 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {players.map((player) => (
              <LobbyPlayerCard
                key={player.id}
                player={player}
                hostId={hostId}
                myId={myId}
                isHost={isHost}
              />
            ))}

            {players.length < MIN_PLAYERS && (
              <div className="p-4 rounded-xl border border-dashed border-stone-600 bg-stone-800/50 text-center flex flex-col items-center gap-2">
                <Loader2 className="size-6 text-stone-500 animate-spin" />
                <p className="text-stone-400">{t("lobby.waitingPlayers")}</p>
                <p className="text-xs text-stone-500">
                  {t("lobby.needMore", { min: MIN_PLAYERS })}
                </p>
              </div>
            )}
          </div>

          {isHost ? (
            <button
              type="button"
              onClick={actions.startGame}
              disabled={!canStart}
              className="w-full shrink-0 group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer bg-ink-primary hover:bg-ink-primary-accent"
            >
              <div className="flex h-full w-full items-center justify-center gap-2 rounded-2xl px-8 py-3 font-bold text-white transition-all group-hover:bg-opacity-0">
                <span className="text-xl sm:text-2xl tracking-wide font-rubik-wet-paint font-extralight">
                  {t("lobby.startGame")}
                </span>
              </div>
            </button>
          ) : (
            <div className="text-center p-4 bg-stone-900 rounded-xl border border-stone-700 animate-pulse">
              <span className="text-stone-400 font-medium">
                {t("lobby.waitingHost")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
