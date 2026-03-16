import React, { useState } from "react";
import { useGameStore } from "../store/gameState";
import { Users } from "lucide-react";

export const JoinScreen: React.FC = () => {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const actions = useGameStore((state) => state.actions);
  const errorMessage = useGameStore((state) => state.errorMessage);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName) return;
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    actions.connectAndCreate(newRoomId, playerName);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !roomId) return;
    actions.connectAndJoin(roomId.toUpperCase(), playerName);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-900">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center">
          <img
            src="/inkpostor-logo.webp"
            alt="Inkpostor Logo"
            className=" h-42"
          />
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <div className="bg-stone-800 p-6 rounded-2xl shadow-xl border border-stone-700 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1 text-left">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl focus:ring-2 focus:ring-ink-primary focus:border-transparent transition-all outline-none text-white placeholder-stone-500"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={15}
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleCreate}
                disabled={!playerName}
                className="w-full relative group overflow-hidden rounded-xl bg-ink-primary px-4 py-3 font-semibold text-white transition-all hover:bg-ink-primary-accent active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-5 h-5" />
                <span>Create New Game</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-stone-800 text-stone-500">OR</span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1 text-left">
                Room Code
              </label>
              <input
                type="text"
                placeholder="E.g. X7K9A2"
                className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl focus:ring-2 focus:ring-ink-secondary focus:border-transparent transition-all outline-none text-center uppercase tracking-widest text-white placeholder-stone-600"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={!playerName || !roomId}
              className="w-full rounded-xl bg-ink-secondary px-4 py-3 font-semibold text-black transition-all hover:bg-white active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
            >
              Join Game
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
