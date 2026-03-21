import React, { useState } from "react";
import { useGameStore } from "../store/gameState";
import { Brush, Eye } from "lucide-react";

export const RoleReveal: React.FC = () => {
  const [revealed, setRevealed] = useState(false);
  const amIImpostor = useGameStore((state) => state.amIImpostor);
  const secretCategory = useGameStore((state) => state.secretCategory);
  const secretWord = useGameStore((state) => state.secretWord);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const actions = useGameStore((state) => state.actions);

  const isHost = myId === hostId;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-950 relative overflow-hidden">
      {/* Background ambient light */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-[120px] rounded-full opacity-20 pointer-events-none transition-colors duration-1000 ${revealed ? (amIImpostor ? "bg-red-500" : "bg-emerald-500") : "bg-blue-500"}`}
      />

      <div className="z-10 max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-stone-400">Phase 1</h2>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Your Secret Role
          </h1>
        </div>

        <div className="relative">
          <button
            onMouseDown={() => setRevealed(true)}
            onMouseUp={() => setRevealed(false)}
            onMouseLeave={() => setRevealed(false)}
            onTouchStart={() => setRevealed(true)}
            onTouchEnd={() => setRevealed(false)}
            className={`w-full aspect-video rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer select-none animate-fade-in
              ${
                revealed
                  ? amIImpostor
                    ? "border-red-500/50 bg-red-950/40 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
                    : "border-emerald-500/50 bg-emerald-950/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                  : "border-stone-700 bg-stone-800 hover:bg-stone-750 hover:border-stone-600"
              }`}
          >
            {revealed ? (
              <div className="animate-in zoom-in-95 duration-200 fade-in flex flex-col items-center space-y-4 my-4">
                {amIImpostor ? (
                  <>
                    <img
                      src="/inkpostor-character.webp"
                      alt="Inkpostor Logo"
                      className="h-20"
                    />
                    <h3 className="text-3xl font-black text-white tracking-widest uppercase">
                      You are the <br />
                      <span className="text-red-500">Inkpostor</span>
                    </h3>
                    <p className="text-red-500 font-medium px-4 py-1 bg-red-900/50 rounded-full border border-red-500/30 text-sm ">
                      Hint: {secretCategory}
                    </p>
                  </>
                ) : (
                  <>
                    <img
                      src="/no-inkpostor-character.webp"
                      alt="No Inkpostor Logo"
                      className="h-20"
                    />
                    <p className="text-emerald-200/80 font-medium mb-0 uppercase tracking-widest text-sm">
                      The word is
                    </p>
                    <h3 className="text-4xl font-black text-white">
                      {secretWord}
                    </h3>
                    <p className="text-emerald-400  font-medium px-4 py-1 bg-emerald-900/50 rounded-full border border-emerald-500/30 text-sm">
                      Category: {secretCategory}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-stone-400 gap-4 transition-transform group-hover:scale-105">
                <Eye className="w-12 h-12" />
                <span className="text-lg font-medium">
                  Press and hold to reveal
                </span>
              </div>
            )}
          </button>
        </div>

        {isHost ? (
          <div className="pt-8">
            <p className="text-stone-500 text-sm mb-4">
              Make sure everyone knows their role before continuing.
            </p>
            <button
              onClick={actions.proceedToDrawing}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-ink-secondary text-stone-900 px-8 py-3 font-bold text-lg transition-all hover:bg-white cursor-pointer active:scale-95 shadow-lg shadow-white/10"
            >
              <Brush className="w-5 h-5" />
              Start Drawing
            </button>
          </div>
        ) : (
          <div className=" text-stone-500 flex items-center justify-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-stone-500"></span>
            </span>
            Waiting for Host to begin...
          </div>
        )}
      </div>
    </div>
  );
};
