import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import { Users } from "lucide-react";
import { SERVER_URL } from "../socket";

export const JoinScreen: React.FC = () => {
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
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

  useEffect(() => {
    const checkHealth = async () => {
      setIsCheckingHealth(true);
      try {
        const res = await fetch(`${SERVER_URL || ""}/health`, {
          method: "GET",
        });

        if (res.ok) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }
      } catch {
        setServerOnline(false);
      } finally {
        setIsCheckingHealth(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-900">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center">
          <img
            src="/inkpostor-logo.webp"
            alt="Inkpostor Logo"
            className=" h-42 animate-zoom-in"
          />
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <div className="bg-stone-800 p-6 rounded-2xl shadow-xl border border-stone-700 space-y-6 animate-fade-in-up">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1 text-left">
                {t("join.yourName")}
              </label>
              <input
                type="text"
                placeholder={t("join.enterName")}
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
                <span>{t("join.createGame")}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-stone-800 text-stone-500">
                {t("join.or")}
              </span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1 text-left">
                {t("join.roomCode")}
              </label>
              <input
                type="text"
                placeholder={t("join.roomCodePlaceholder")}
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
              {t("join.joinGame")}
            </button>
          </form>
        </div>
      </div>
      <div className="flex items-center justify-center h-8">
        {isCheckingHealth ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-stone-400">
              {t("join.checkingServer")}
            </span>
          </div>
        ) : serverOnline ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-500">
              {t("join.serverOnline")}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-500">
              {t("join.serverOffline")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
