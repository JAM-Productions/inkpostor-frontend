import React from "react";
import { useTranslation } from "react-i18next";

interface SecretWordPanelProps {
  /** Null when the game ended before a word ever existed. */
  secretWord: string | null;
}

/** The word the game was played on, opened once the game is over. */
export const SecretWordPanel: React.FC<SecretWordPanelProps> = ({
  secretWord,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative bg-ink-surface rounded-[20px_6px_22px_7px] p-6 border-3 border-stone-950 shadow-[5px_5px_0px_#0c0b09] animate-fade-in animate-delay-1000 animate-duration-slower">
      {secretWord ? (
        <>
          <p className="text-amber-200/80 mb-1 uppercase tracking-wider text-base font-handwritten font-bold">
            {t("result.secretWord")}
          </p>
          <div className="text-3xl sm:text-4xl font-handwritten font-extrabold text-white drop-shadow-sm">
            {secretWord}
          </div>
        </>
      ) : (
        <div
          className="flex items-center justify-center gap-2 text-xl font-handwritten font-bold text-stone-400"
          data-testid="no-secret-word"
        >
          {t("result.noSecretWord")}
        </div>
      )}
    </div>
  );
};
