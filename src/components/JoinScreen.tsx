import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import { Users } from "lucide-react";
import { SERVICE_URL } from "../socket";

export const JoinScreen: React.FC = () => {
  const { t } = useTranslation();
  const myName = useGameStore((state) => state.myName);
  const [playerName, setPlayerName] = useState(myName || "");
  const [roomId, setRoomId] = useState("");
  const isCheckingHealth = useGameStore((state) => state.isCheckingHealth);
  const serviceOnline = useGameStore((state) => state.serviceOnline);
  const actions = useGameStore((state) => state.actions);
  const errorMessage = useGameStore((state) => state.errorMessage);
  const hasInitialized = useRef(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !serviceOnline) return;
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    actions.connectAndCreate(newRoomId, playerName);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !roomId || !serviceOnline) return;
    actions.connectAndJoin(roomId.toUpperCase(), playerName);
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get("room");
    if (roomFromUrl) {
      setRoomId(roomFromUrl.toUpperCase());
    }

    const init = async () => {
      await actions.checkHealth();
      const currentState = useGameStore.getState();
      if (currentState.serviceOnline && roomFromUrl && myName) {
        actions.connectAndJoin(roomFromUrl.toUpperCase(), myName);
      }
    };

    init();
  }, [myName, actions]);

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

        {serviceOnline || isCheckingHealth ? (
          <div className="bg-stone-800 p-6 rounded-2xl shadow-xl border border-stone-700 space-y-6 animate-fade-in-up">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="player-name"
                  className="block text-sm font-medium text-stone-400 mb-1 text-left"
                >
                  {t("join.yourName")}
                </label>
                <input
                  id="player-name"
                  type="text"
                  placeholder={t("join.enterName")}
                  className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl focus:ring-2 focus:ring-ink-primary focus:border-transparent transition-all outline-none text-white placeholder-stone-500 disabled:opacity-50"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={15}
                  disabled={isCheckingHealth}
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!playerName || isCheckingHealth}
                  className="w-full relative group overflow-hidden rounded-xl bg-ink-primary px-4 py-3 font-semibold text-white transition-all hover:bg-ink-primary-accent active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="size-5" />
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
                <label
                  htmlFor="room-code"
                  className="block text-sm font-medium text-stone-400 mb-1 text-left"
                >
                  {t("join.roomCode")}
                </label>
                <input
                  id="room-code"
                  type="text"
                  placeholder={t("join.roomCodePlaceholder")}
                  className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl focus:ring-2 focus:ring-ink-secondary focus:border-transparent transition-all outline-none text-center uppercase tracking-widest text-white placeholder-stone-600 disabled:opacity-50"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  maxLength={6}
                  disabled={isCheckingHealth}
                />
              </div>
              <button
                type="submit"
                disabled={!playerName || !roomId || isCheckingHealth}
                className="w-full rounded-xl bg-ink-secondary px-4 py-3 font-semibold text-black transition-all hover:bg-white active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
              >
                {t("join.joinGame")}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex  gap-3 justify-center animate-fade-in animate-duration-slower animate-delay-400 min-h-100.5">
            <span className="text-xl font-rubik-wet-paint font-extralight text-red-700 mt-10 ">
              {t("join.serviceOffline")}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center animate-fade-in animate-delay-600 min-h-10">
        {isCheckingHealth && (
          <div className="flex items-center gap-2 mt-2.5">
            <div className="size-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-stone-400">
              {t("join.checkingService")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
