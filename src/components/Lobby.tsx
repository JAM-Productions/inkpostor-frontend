import React from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import { useModalStore } from "../store/modalStore";
import { Users, Loader2, HelpCircle, Settings } from "lucide-react";
import {
  DEFAULT_GAME_OPTIONS,
  DRAWING_OPTION_SECTIONS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  MODE_OPTION_SECTIONS,
  SECTION_OPTION_KEYS,
} from "../lib/constants";
import { useImpostorCountClamp } from "../hooks/useImpostorCountClamp";
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

  // A player leaving can take the impostor count out of range, and it is the
  // host's client that puts it back
  useImpostorCountClamp();

  const isHost = myId === hostId;
  const canStart = isHost && players.length >= MIN_PLAYERS;
  const hasRoomId = !!roomId;
  // Only what the mode actually puts on screen counts: an option it hides can
  // still hold a value from another mode, and that is nothing the host changed
  // here. Unknown modes (server deployed first) fall back to the drawing ones.
  let changedModeOptions = 0;

  for (const section of MODE_OPTION_SECTIONS[gameMode] ??
    DRAWING_OPTION_SECTIONS) {
    for (const key of SECTION_OPTION_KEYS[section]) {
      if (gameOptions[key] !== DEFAULT_GAME_OPTIONS[key]) {
        changedModeOptions++;
      }
    }
  }
  const optionsChangedCount =
    Number(gameMode !== "CLASSIC") + changedModeOptions;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#161412] px-4 pt-16 pb-8 sm:px-6 sm:pt-20 md:pt-24 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-red-950/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="z-10 max-w-lg w-full space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-amber-200/70 font-handwritten font-bold tracking-widest uppercase text-base sm:text-lg">
            {t("lobby.roomCode")}
          </h2>
          <CopyCodeButton roomId={roomId} />

          {hasRoomId && (
            <div className="pt-1">
              <CopyLinkButton roomId={roomId} />
            </div>
          )}
        </div>

        <div className="relative bg-[#26221d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] p-6 sm:p-7 shadow-[6px_6px_0px_0px_#0c0b09] border-3 border-stone-950 flex flex-col max-h-[70vh]">
          {/* Taped top corner accent */}
          <div className="absolute -top-3 right-10 w-24 h-5 bg-amber-100/30 border border-stone-400/40 transform rotate-2 pointer-events-none shadow-sm" />

          <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-dashed border-stone-700">
            <div className="flex justify-center items-center gap-3">
              <h3 className="text-xl sm:text-2xl font-handwritten font-bold text-white flex items-center gap-2">
                <Users className="text-amber-300 size-6" />
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
                className="relative p-1.5 rounded-lg border border-stone-700 bg-[#181512] hover:bg-stone-800 transition-transform active:scale-95 cursor-pointer shadow-[2px_2px_0px_#000]"
              >
                <Settings className="size-5 text-amber-200" />
                {optionsChangedCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 block size-2.5 rounded-full bg-amber-400 border border-stone-950 shadow-sm"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label={t("rules.open")}
                onClick={() => modalActions.openModal("RULES")}
                className="flex items-center gap-1.5 font-bold cursor-pointer p-1.5 rounded-lg border border-stone-700 bg-[#181512] hover:bg-stone-800 transition-transform active:scale-95 shadow-[2px_2px_0px_#000]"
                data-testid="how-to-play-btn"
              >
                <HelpCircle className="size-5 text-red-400 hover:text-red-300" />
              </button>
              <span className="bg-[#181512] border-2 border-stone-700 text-amber-200/90 text-sm font-handwritten font-bold px-3 py-1 rounded-[12px_4px_14px_4px] shadow-[2px_2px_0px_#000]">
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

          <div className="space-y-2.5 sm:space-y-3 mb-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {players.map((player, index) => (
              <LobbyPlayerCard
                key={player.id}
                player={player}
                hostId={hostId}
                myId={myId}
                isHost={isHost}
                index={index}
              />
            ))}

            {players.length < MIN_PLAYERS && (
              <div className="p-4 rounded-[18px_6px_20px_8px] border-2 border-dashed border-stone-700 bg-[#181512]/60 text-center flex flex-col items-center gap-2">
                <Loader2 className="size-6 text-amber-400 animate-spin" />
                <p className="text-amber-200/80 font-handwritten text-lg">
                  {t("lobby.waitingPlayers")}
                </p>
                <p className="text-sm font-handwritten text-stone-400">
                  {t("lobby.needMore", { min: MIN_PLAYERS })}
                </p>
              </div>
            )}
          </div>

          {isHost ? (
            <button
              type="button"
              data-testid="start-game-btn"
              onClick={actions.startGame}
              disabled={!canStart}
              className="w-full shrink-0 group relative overflow-hidden rounded-[22px_7px_18px_9px] border-3 border-stone-950 transition-all hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] disabled:opacity-50 disabled:hover:rotate-0 disabled:active:translate-x-0 disabled:active:translate-y-0 cursor-pointer bg-red-600 hover:bg-red-500 shadow-[4px_4px_0px_#000]"
            >
              <div className="flex h-full w-full items-center justify-center gap-2 px-8 py-3.5 font-bold text-white">
                <span className="text-2xl sm:text-3xl tracking-wider font-rubik-wet-paint">
                  {t("lobby.startGame")}
                </span>
              </div>
            </button>
          ) : (
            <div className="text-center p-4 bg-[#181512] rounded-[18px_6px_20px_8px] border-2 border-stone-700 animate-pulse shadow-[3px_3px_0px_#000]">
              <span className="text-amber-200/80 font-handwritten text-lg font-bold">
                {t("lobby.waitingHost")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
