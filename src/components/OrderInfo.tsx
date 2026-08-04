import React from "react";
import { useTranslation } from "react-i18next";
import { Vote } from "lucide-react";
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-950 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 blur-[120px] rounded-full opacity-20 pointer-events-none bg-ink-primary" />

      <div className="z-10 max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-stone-400">
            {t("orderInfo.round", { round: currentRound })}
          </h2>
          <h1 className="text-4xl font-semibold text-white tracking-tight">
            {t("orderInfo.title")}
          </h1>
          <p className="text-sm text-stone-400">
            {showsFullOrder
              ? t("orderInfo.followOrder")
              : t("orderInfo.youDecideRest")}
          </p>
        </div>

        {showsFullOrder ? (
          <div
            className="space-y-2 text-left max-h-[45vh] overflow-y-auto custom-scrollbar pr-1"
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
            <div data-testid="starting-player">
              <OrderPlayerCard player={starter} hostId={hostId} myId={myId} />
            </div>
          )
        )}

        <p className="text-sm text-stone-500">{t("orderInfo.sayOneWord")}</p>

        <div className="pt-1" style={{ minHeight: "4rem" }}>
          {isEjected || hasConfirmed ? (
            <div className="text-stone-500 flex items-center justify-center gap-3 text-sm sm:text-base py-3.5 animate-fade-in">
              <span className="relative flex size-2 sm:size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 sm:size-3 bg-stone-500"></span>
              </span>
              {t("orderInfo.waitingPlayers", {
                count: pendingPlayers.filter((p) => p.hasConfirmedOrder).length,
                total: pendingPlayers.length,
              })}
            </div>
          ) : (
            <button
              type="button"
              onClick={actions.confirmOrder}
              className="animate-fade-in-up flex items-center justify-center gap-2 w-full rounded-2xl bg-ink-secondary text-stone-900 px-8 py-3 font-bold text-lg transition-[background-color,scale] hover:bg-white cursor-pointer active:scale-95 shadow-lg shadow-white/10"
            >
              <Vote className="size-5" />
              {t("orderInfo.confirm")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
