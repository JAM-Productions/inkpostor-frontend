import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, Vote } from "lucide-react";
import { useGameStore, type Player } from "../store/gameState";
import { OrderPlayerCard } from "./OrderPlayerCard";
import { FULL_ORDER_MODES } from "../lib/constants";

// Start of every ORIGINAL round: nothing is drawn, so this screen is what tells
// the table who opens the round. It is public information — the gate is only
// there so nobody is still reading it when voting opens.
export const OrderInfo: React.FC = () => {
  const { t } = useTranslation();
  const players = useGameStore((state) => state.players);
  const turnOrder = useGameStore((state) => state.turnOrder);
  const turnOrderMode = useGameStore(
    (state) => state.gameOptions.turnOrderMode,
  );

  const virtualVotingEnabled = useGameStore(
    (state) => state.gameOptions.virtualVotingEnabled,
  );
  const currentRound = useGameStore((state) => state.currentRound);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const actions = useGameStore((state) => state.actions);

  const me = players.find((p) => p.id === myId);
  const hasConfirmed = me?.hasConfirmedOrder;
  // Ejected players may watch, but nobody waits for them: they get no button.
  const isEjected = !!me?.isEjected;
  const pendingPlayers = players.filter((p) => !p.isEjected);

  // Ejected players simply drop out of the order, which is what moves the start
  // on to the next player.
  const orderedPlayers = turnOrder
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => !!p && !p.isEjected);
  const starter = orderedPlayers[0];

  const showsFullOrder = FULL_ORDER_MODES.includes(turnOrderMode);
  const isHost = myId === hostId;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink-bg px-4 pt-16 pb-8 sm:px-6 sm:pt-20 md:pt-24 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[130px] rounded-full opacity-30 pointer-events-none bg-red-950" />

      <div className="z-10 max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          {virtualVotingEnabled && (
            <h2 className="text-xl font-handwritten font-bold text-amber-200/70 uppercase tracking-widest">
              {t("orderInfo.round", { round: currentRound })}
            </h2>
          )}
          <h1 className="text-3xl sm:text-4xl font-rubik-wet-paint text-white tracking-wide">
            {t("orderInfo.title")}
          </h1>
          <p className="text-amber-200/80 font-handwritten text-lg pt-1">
            {showsFullOrder
              ? t("orderInfo.followOrder")
              : t("orderInfo.youDecideRest")}
          </p>
        </div>

        {showsFullOrder ? (
          <div
            className="space-y-2.5 text-left p-3.5 sm:p-4 bg-ink-surface rounded-[24px_10px_22px_12px] border-3 border-stone-950 shadow-[6px_6px_0px_#0c0b09]"
            data-testid="turn-order-list"
          >
            {orderedPlayers.map((player, index) => (
              <OrderPlayerCard
                key={player.id}
                player={player}
                hostId={hostId}
                myId={myId}
                position={index + 1}
              />
            ))}
          </div>
        ) : (
          starter && (
            <div
              data-testid="starting-player"
              className="bg-ink-surface p-3.5 sm:p-4 rounded-[24px_10px_22px_12px] border-3 border-stone-950 shadow-[6px_6px_0px_#0c0b09]"
            >
              <OrderPlayerCard player={starter} hostId={hostId} myId={myId} />
            </div>
          )
        )}

        <p className="text-base font-handwritten text-amber-200/60">
          {t("orderInfo.sayOneWord")}
        </p>

        <div className="pt-1" style={{ minHeight: "4rem" }}>
          {!virtualVotingEnabled ? (
            isHost ? (
              <button
                type="button"
                data-testid="reveal-results-btn"
                onClick={actions.revealResults}
                className="animate-fade-in-up flex items-center justify-center gap-2.5 w-full rounded-[22px_7px_18px_9px] border-3 border-stone-950 bg-amber-300 hover:bg-amber-200 text-stone-950 px-8 py-3.5 font-handwritten font-bold text-xl transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer shadow-[4px_4px_0px_#0c0b09]"
              >
                <Eye className="size-6 text-stone-950" />
                {t("orderInfo.revealResults")}
              </button>
            ) : (
              <div className="text-amber-200/70 font-handwritten text-lg font-bold flex items-center justify-center gap-3 py-3.5 animate-fade-in">
                <span className="relative flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-3 bg-amber-500"></span>
                </span>
                {t("orderInfo.waitingHostReveal")}
              </div>
            )
          ) : isEjected || hasConfirmed ? (
            <div className="text-amber-200/70 font-handwritten text-lg font-bold flex items-center justify-center gap-3 py-3.5 animate-fade-in">
              <span className="relative flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-3 bg-amber-500"></span>
              </span>
              {t("orderInfo.waitingPlayers", {
                count: pendingPlayers.filter((p) => p.hasConfirmedOrder).length,
                total: pendingPlayers.length,
              })}
            </div>
          ) : (
            <button
              type="button"
              data-testid="confirm-order-btn"
              onClick={actions.confirmOrder}
              className="animate-fade-in-up flex items-center justify-center gap-2.5 w-full rounded-[22px_7px_18px_9px] border-3 border-stone-950 bg-amber-300 hover:bg-amber-200 text-stone-950 px-8 py-3.5 font-handwritten font-bold text-xl transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer shadow-[4px_4px_0px_#0c0b09]"
            >
              <Vote className="size-6 text-stone-950" />
              {t("orderInfo.confirm")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
