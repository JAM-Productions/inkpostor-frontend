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
        <p className="text-sm font-handwritten font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
          <Sparkles className="size-4" />
          {t("impostorGuess.attemptsLeft", { count: attemptsLeft })}
        </p>
      )}
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          data-testid="impostor-guess-input"
          value={guess}
          autoFocus={autoFocus}
          onChange={(e) => setGuess(e.target.value)}
          placeholder={t("impostorGuess.placeholder")}
          aria-label={t("impostorGuess.placeholder")}
          maxLength={40}
          className="min-w-0 flex-1 rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-[#181512] px-4 py-2.5 text-white font-handwritten text-lg placeholder-amber-200/50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6)] focus:border-purple-400 focus:outline-none"
        />
        <button
          type="submit"
          data-testid="submit-guess-btn"
          disabled={!guess.trim()}
          className="shrink-0 rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-purple-600 px-4 py-2.5 font-bold text-white shadow-[3px_3px_0px_#000] transition-colors transition-transform hover:bg-purple-500 hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <CornerDownRight className="size-5 stroke-[3]" />
        </button>
      </div>
    </form>
  );
};
