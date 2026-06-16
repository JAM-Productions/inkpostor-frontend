import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { CornerDownRight, Sparkles } from "lucide-react";
import { useGameStore } from "../store/gameState";

interface ImpostorGuessFormProps {
  attemptsLeft?: number;
  autoFocus?: boolean;
  className?: string;
}

export const ImpostorGuessForm: React.FC<ImpostorGuessFormProps> = ({
  attemptsLeft,
  autoFocus,
  className,
}) => {
  const { t, i18n } = useTranslation();
  const actions = useGameStore((state) => state.actions);
  const [guess, setGuess] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guess.trim();
    if (!trimmed) return;
    // Validate against the word in the language the player has selected.
    actions.submitImpostorGuess(trimmed, i18n.language);
    setGuess("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-2 ${className ?? ""}`}
    >
      {typeof attemptsLeft === "number" && (
        <p className="text-xs font-bold uppercase tracking-wider text-purple-300/90 flex items-center gap-1.5">
          <Sparkles className="size-3.5" />
          {t("impostorGuess.attemptsLeft", { count: attemptsLeft })}
        </p>
      )}
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          value={guess}
          autoFocus={autoFocus}
          onChange={(e) => setGuess(e.target.value)}
          placeholder={t("impostorGuess.placeholder")}
          aria-label={t("impostorGuess.placeholder")}
          maxLength={40}
          className="min-w-0 flex-1 rounded-xl border-2 border-purple-500/40 bg-stone-900 px-4 py-2.5 text-white placeholder-stone-500 focus:border-purple-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!guess.trim()}
          className="shrink-0 rounded-xl bg-purple-600 px-4 py-2.5 font-bold text-white transition-all hover:bg-purple-500 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <CornerDownRight className="size-5" />
        </button>
      </div>
    </form>
  );
};
