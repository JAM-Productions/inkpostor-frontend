import React from "react";
import { useGameStore } from "../store/gameState";
import { Users, Crown, Play, Loader2 } from "lucide-react";

export const Lobby: React.FC = () => {
  const roomId = useGameStore((state) => state.roomId);
  const players = useGameStore((state) => state.players);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const actions = useGameStore((state) => state.actions);

  const isHost = myId === hostId;
  const canStart = isHost && players.length >= 3;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 py-12 bg-stone-900">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center space-y-4">
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

        <div className="bg-stone-800 rounded-3xl p-6 shadow-xl border border-stone-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="text-blue-400" />
              Players
            </h3>
            <span className="bg-stone-700 text-stone-300 text-sm font-semibold px-3 py-1 rounded-full">
              {players.length} joined
            </span>
          </div>

          <div className="space-y-3 mb-8">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${player.id === myId ? "bg-blue-900/20 border-blue-500/30" : "bg-stone-900 border-stone-700/50"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${player.id === hostId ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-stone-700 text-stone-300"}`}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-white text-lg">
                      {player.name}
                    </span>
                    {player.id === myId && (
                      <span className="ml-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                        (You)
                      </span>
                    )}
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

            {players.length < 3 && (
              <div className="p-4 rounded-xl border border-dashed border-stone-600 bg-stone-800/50 text-center flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-stone-500 animate-spin" />
                <p className="text-stone-400">Waiting for more players...</p>
                <p className="text-xs text-stone-500">
                  Need at least 3 players to start
                </p>
              </div>
            )}
          </div>

          {isHost ? (
            <button
              onClick={actions.startGame}
              disabled={!canStart}
              className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-[2px] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <div className="flex h-full w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 font-bold text-white transition-all group-hover:bg-opacity-0">
                <Play className="fill-white w-6 h-6" />
                <span className="text-xl tracking-wide">START GAME</span>
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
