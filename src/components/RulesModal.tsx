import React, { useEffect, useRef } from "react";
import {
  X,
  HelpCircle,
  Target,
  Settings,
  PenTool,
  Search,
  Vote,
  Trophy,
  Lightbulb,
} from "lucide-react";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };

      window.addEventListener("keydown", handleEscape);
      return () => {
        window.removeEventListener("keydown", handleEscape);
        previousFocus.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm w-full h-full cursor-default"
        onClick={onClose}
        aria-label="Close rules"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full h-full sm:h-auto sm:max-h-[calc(100vh-4rem)] sm:max-w-2xl bg-stone-900 sm:rounded-3xl border-0 sm:border border-stone-800 shadow-2xl flex flex-col overflow-hidden outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-ink-primary/10 rounded-lg">
              <HelpCircle className="w-6 h-6 text-ink-primary" />
            </div>
            <h2
              id="rules-title"
              className="text-2xl font-extralight text-white font-rubik-wet-paint tracking-wide"
            >
              How to Play Inkpostor
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-white cursor-pointer"
            aria-label="Close rules dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Objective */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-ink-primary">
              <Target className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                Objective
              </h3>
            </div>
            <p className="text-stone-300 leading-relaxed">
              Find out who the impostor is… or fool everyone if it's you.
            </p>
          </section>

          {/* Setup */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-amber-500">
              <Settings className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                Setup
              </h3>
            </div>
            <ul className="space-y-2 text-stone-400 text-sm">
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                Each player receives a secret word.
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                All players get the same word, except the impostor.
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                The impostor receives only a related hint, not the exact word.
              </li>
            </ul>
          </section>

          {/* Drawing Turns */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-blue-500">
              <PenTool className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                Drawing Turns
              </h3>
            </div>
            <ul className="space-y-2 text-stone-400 text-sm">
              <li className="flex gap-3">
                <span className="text-blue-500">•</span>
                The game is played in turns.
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500">•</span>
                In each turn, each player draws a part of the word.
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500">•</span>
                The drawing is shared: everyone contributes to the same canvas.
              </li>
            </ul>
          </section>

          {/* Observe & Deduce */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-purple-500">
              <Search className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                Observe & Deduce
              </h3>
            </div>
            <ul className="space-y-2 text-stone-400 text-sm">
              <li className="flex gap-3">
                <span className="text-purple-500">•</span>
                While drawing, try to figure out who doesn't know the word.
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500">•</span>
                The impostor must draw carefully to avoid suspicion.
              </li>
            </ul>
          </section>

          {/* Voting Phase */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-orange-500">
              <Vote className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                Voting Phase
              </h3>
            </div>
            <p className="text-stone-300 text-sm mb-2">
              At the end of the round:
            </p>
            <ul className="space-y-2 text-stone-400 text-sm">
              <li className="flex gap-3">
                <span className="text-orange-500">•</span>
                Players can vote to eliminate someone or skip the vote.
              </li>
              <li className="flex gap-3">
                <span className="text-orange-500">•</span>
                If a player gets the majority of votes, they are eliminated.
              </li>
            </ul>
          </section>

          {/* End of the Game */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-green-500">
              <Trophy className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-wider text-sm">
                End of the Game
              </h3>
            </div>
            <ul className="space-y-2 text-stone-400 text-sm">
              <li className="flex gap-3">
                <span className="text-green-500">•</span>
                If the impostor is caught → the players win.
              </li>
              <li className="flex gap-3">
                <span className="text-green-500">•</span>
                If the impostor survives → the impostor wins.
              </li>
            </ul>
          </section>

          {/* Tip */}
          <div className="bg-stone-800/50 rounded-2xl p-4 border border-stone-700/50 flex gap-4 items-center">
            <div className="shrink-0 p-2 bg-yellow-500/10 rounded-lg h-fit">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Tip</h4>
              <p className="text-stone-400 text-sm italic">
                Draw enough to show you know the word… but don't make it too
                obvious
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-800 bg-stone-900/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
          >
            GOT IT!
          </button>
        </div>
      </div>
    </div>
  );
};
