import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameState";
import { useSoundStore } from "../store/soundStore";
import { Users } from "lucide-react";
import { SERVICE_URL } from "../config";

export const JoinScreen: React.FC = () => {
  const { t } = useTranslation();
  const myName = useGameStore((state) => state.myName);
  const [playerName, setPlayerName] = useState(myName || "");
  const [roomId, setRoomId] = useState("");
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [serviceOnline, setServiceOnline] = useState(false);
  const actions = useGameStore((state) => state.actions);
  const errorMessage = useGameStore((state) => state.errorMessage);
  const playSound = useSoundStore((state) => state.actions.playSound);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !serviceOnline) return;
    playSound("click");
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    actions.connectAndCreate(newRoomId, playerName);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !roomId || !serviceOnline) return;
    playSound("click");
    actions.connectAndJoin(roomId.toUpperCase(), playerName);
  };

  // A new error banner gets an audible cue; a repeat of the same message does not.
  useEffect(() => {
    if (errorMessage) {
      playSound("error");
    }
  }, [errorMessage, playSound]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get("room");
    if (roomFromUrl) {
      setRoomId(roomFromUrl.toUpperCase());
    }

    const checkHealth = async () => {
      setIsCheckingHealth(true);
      try {
        const res = await fetch(`${SERVICE_URL || ""}/health`, {
          method: "GET",
        });

        if (res.ok) {
          setServiceOnline(true);
          if (roomFromUrl && myName) {
            actions.connectAndJoin(roomFromUrl.toUpperCase(), myName);
          }
        } else {
          setServiceOnline(false);
        }
      } catch {
        setServiceOnline(false);
      } finally {
        setIsCheckingHealth(false);
      }
    };

    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink-bg px-4 pt-16 pb-8 sm:px-6 sm:pt-20 md:pt-24 relative overflow-hidden">
      {/* Background ambient ink glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-amber-900/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="z-10 max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center relative">
          <img
            src="/inkpostor-logo.webp"
            alt="Inkpostor Logo"
            className="h-44 animate-zoom-in drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
          />
        </div>

        {errorMessage && (
          <div className="bg-red-950/80 border-2 border-red-500 text-red-200 p-3.5 rounded-[18px_6px_20px_8px] text-base font-handwritten shadow-[3px_3px_0px_#000]">
            {errorMessage}
          </div>
        )}

        {serviceOnline || isCheckingHealth ? (
          <div className="relative bg-ink-surface p-6 sm:p-8 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 border-stone-950 shadow-[6px_6px_0px_0px_#0c0b09] space-y-6 animate-fade-in-up">
            {/* Taped top corner accent */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-amber-100/30 border border-stone-400/40 rounded-sm transform -rotate-1 pointer-events-none shadow-sm" />

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="player-name"
                  className="block text-lg font-handwritten font-bold text-amber-100/90 mb-1.5 text-left tracking-wide"
                >
                  {t("join.yourName")}
                </label>
                <input
                  id="player-name"
                  type="text"
                  placeholder={t("join.enterName")}
                  className="w-full px-4 py-3 bg-[#181512] border-2 border-stone-700 focus:border-amber-400 rounded-[18px_6px_22px_7px] outline-none text-white text-xl font-handwritten placeholder-stone-500 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)] transition-colors disabled:opacity-50"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={15}
                  disabled={isCheckingHealth}
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  data-testid="create-room-btn"
                  onClick={handleCreate}
                  disabled={!playerName || isCheckingHealth}
                  className="w-full relative group rounded-[22px_7px_18px_9px] border-2 border-stone-950 bg-red-600 hover:bg-red-500 px-5 py-3.5 text-xl font-bold text-white shadow-[4px_4px_0px_0px_#0c0b09] hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0c0b09] transition-colors disabled:opacity-50 disabled:hover:rotate-0 disabled:active:translate-x-0 disabled:active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer font-handwritten tracking-wide"
                >
                  <Users className="size-6" />
                  <span>{t("join.createGame")}</span>
                </button>
              </div>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-dashed border-stone-700"></div>
              </div>
              <div className="relative flex justify-center text-base">
                <span className="px-3 bg-ink-surface text-amber-200/60 font-handwritten font-bold">
                  {t("join.or")}
                </span>
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label
                  htmlFor="room-code"
                  className="block text-lg font-handwritten font-bold text-amber-100/90 mb-1.5 text-left tracking-wide"
                >
                  {t("join.roomCode")}
                </label>
                <input
                  id="room-code"
                  type="text"
                  placeholder={t("join.roomCodePlaceholder")}
                  className="w-full px-4 py-3 bg-[#181512] border-2 border-stone-700 focus:border-amber-400 rounded-[16px_8px_20px_6px] outline-none text-center uppercase tracking-widest text-white text-2xl font-short-stack placeholder-stone-600 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)] transition-colors disabled:opacity-50"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  maxLength={6}
                  disabled={isCheckingHealth}
                />
              </div>
              <button
                type="submit"
                data-testid="join-room-btn"
                disabled={!playerName || !roomId || isCheckingHealth}
                className="w-full rounded-[18px_8px_20px_6px] border-2 border-stone-950 bg-amber-300 hover:bg-amber-200 px-5 py-3.5 text-xl font-bold text-stone-950 shadow-[4px_4px_0px_0px_#0c0b09] hover:rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0c0b09] transition-colors disabled:opacity-50 disabled:hover:rotate-0 disabled:active:translate-x-0 disabled:active:translate-y-0 cursor-pointer font-handwritten tracking-wide"
              >
                {t("join.joinGame")}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-center animate-fade-in animate-duration-slower animate-delay-400 min-h-129.5">
            <div className="relative flex flex-col items-center">
              {/* Mancha de tinta */}
              <div className="absolute -inset-0.5 -top-53 bg-red-950/30 blur-2xl rounded-full" />

              <span className="relative -top-33 mt-6 text-3xl font-rubik-wet-paint text-red-400 tracking-wide rotate-1">
                {t("join.serviceOffline")}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center animate-fade-in animate-delay-600 min-h-10">
        {isCheckingHealth && (
          <div className="relative flex items-center gap-3 mt-10 px-5 py-2.5 bg-ink-surface border-2 border-stone-800 rounded-[12px_5px_14px_7px] shadow-[3px_3px_0px_#0c0b09] -rotate-1">
            {/* Pequeño trozo de cinta */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-amber-100/20 border border-stone-500/30 rotate-1" />

            {/* Indicador */}
            <div className="relative size-3">
              <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
              <div className="absolute inset-0.75 rounded-full bg-amber-400" />
            </div>

            <span className="text-base font-handwritten font-bold tracking-wide text-amber-100/70">
              {t("join.checkingService")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
