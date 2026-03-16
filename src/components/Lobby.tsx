import React from "react";
import { useGameStore } from "../store/gameState";
import { Users, Crown, Loader2 } from "lucide-react";
import { MAX_PLAYERS, MIN_PLAYERS } from "../lib/constants";

export const Lobby: React.FC = () => {
  const roomId = useGameStore((state) => state.roomId);
  const players = useGameStore((state) => state.players);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const actions = useGameStore((state) => state.actions);

  const isHost = myId === hostId;
  const canStart = isHost && players.length >= 3;

  return (
    <div className="flex flex-col items-center justify-center max-h-screen p-4 py-12 bg-stone-900">
      <div className="max-w-lg w-full space-y-4 sm:space-y-8">
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-stone-400 font-medium tracking-widest uppercase text-sm">
            Room Code
          </h2>
          <div className="inline-block bg-stone-800 border border-stone-700 rounded-2xl px-8 py-4 shadow-inner">
            <span className="text-5xl font-mono font-bold tracking-[0.2em] text-white">
              {roomId}
            </span>
          </div>
          <p className="text-stone-500 text-sm">
            Share this code with your friends to let them join!
          </p>
        </div>

        <div className="bg-stone-800 rounded-3xl p-6 shadow-xl border border-stone-700 flex flex-col max-h-[70vh]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Users className="text-ink-secondary w-5 h-5 sm:w-6 sm:h-6" />
              Players
            </h3>
            <span className="bg-stone-700 text-stone-300 text-xs sm:text-sm font-semibold px-3 py-1 rounded-full">
              {players.length < MAX_PLAYERS ? (
                <span>
                  {players.length} / {MAX_PLAYERS} joined
                </span>
              ) : (
                <span className="text-green-400">Full lobby</span>
              )}
            </span>
          </div>

          <div className="space-y-2 sm:space-y-3 mb-8 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border ${player.id === myId ? "bg-white/20 border-white/40" : "bg-stone-900 border-stone-700/50"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg ${player.id === hostId ? "bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-stone-700 text-stone-300"}`}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-white text-sm sm:text-lg">
                      {player.name}
                    </span>
                  </div>
                </div>

                {player.id === hostId && (
                  <div className="flex items-center text-amber-500 gap-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                    <Crown className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Host
                    </span>
                  </div>
                )}
              </div>
            ))}

            {players.length < MIN_PLAYERS && (
              <div className="p-4 rounded-xl border border-dashed border-stone-600 bg-stone-800/50 text-center flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-stone-500 animate-spin" />
                <p className="text-stone-400">Waiting for more players...</p>
                <p className="text-xs text-stone-500">
                  Need at least {MIN_PLAYERS} players to start
                </p>
              </div>
            )}
          </div>

          {isHost ? (
            <button
              onClick={actions.startGame}
              disabled={!canStart}
              className="w-full shrink-0 group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer bg-ink-primary hover:bg-ink-primary-accent"
            >
              <div className="flex h-full w-full items-center justify-center gap-2 rounded-2xl px-8 py-3 font-bold text-white transition-all group-hover:bg-opacity-0">
                <span className="text-xl sm:text-2xl tracking-wide font-rubik-wet-paint font-extralight">
                  START GAME
                </span>
              </div>
            </button>
          ) : (
            <div className="text-center p-4 bg-stone-900 rounded-xl border border-stone-700 animate-pulse">
              <span className="text-stone-400 font-medium">
                Waiting for host to start...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
