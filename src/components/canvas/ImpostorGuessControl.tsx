import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PenLine } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import { useClickOutside } from "../../hooks/useClickOutside";
import { ImpostorGuessForm } from "../ImpostorGuessForm";

/**
 * "Guess Word" button shown in the canvas header. It lets an impostor open a
 * popover with the {@link ImpostorGuessForm} to attempt the secret word while
 * another player is drawing.
 *
 * Renders nothing unless the local player is allowed to guess and it is not
 * their own turn.
 */
export const ImpostorGuessControl: React.FC = () => {
  const { t } = useTranslation();
  const [isGuessOpen, setIsGuessOpen] = useState(false);
  const guessRef = useRef<HTMLDivElement>(null);

  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const myId = useGameStore((state) => state.myId);
  const gameOptions = useGameStore((state) => state.gameOptions);
  const amIImpostor = useGameStore((state) => state.amIImpostor);
  const impostorGuessesUsed = useGameStore(
    (state) => state.impostorGuessesUsed,
  );

  const isMyTurn = currentTurnPlayerId === myId;
  const attemptsLeft = gameOptions.impostorGuessAttempts - impostorGuessesUsed;
  const canGuess =
    !!amIImpostor && gameOptions.impostorGuessEnabled && attemptsLeft > 0;

  useClickOutside(guessRef, isGuessOpen, setIsGuessOpen);

  if (!canGuess || isMyTurn) return null;

  return (
    <div className="md:relative" ref={guessRef}>
      <button
        type="button"
        onClick={() => setIsGuessOpen(!isGuessOpen)}
        className={`flex items-center justify-center gap-2 p-2.5 sm:px-5 sm:py-3 rounded-[14px_4px_16px_5px] font-handwritten font-bold text-lg transition-all hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0px_#0c0b09] cursor-pointer border-2 border-stone-950 ${
          isGuessOpen
            ? "bg-purple-500 text-white -rotate-1"
            : "bg-[#26221d] text-purple-300 hover:bg-stone-800"
        }`}
        aria-label={t("impostorGuess.guessWord")}
      >
        <PenLine className="size-5 text-purple-300" />
        <span className="hidden md:inline">{t("impostorGuess.guessWord")}</span>
      </button>

      {isGuessOpen && (
        <div className="absolute top-full inset-x-0 md:inset-x-auto md:left-auto md:right-0 md:min-w-87.5 mt-3 p-4 bg-[#26221d] rounded-[20px_6px_22px_7px] border-3 border-stone-950 shadow-[6px_6px_0px_#0c0b09] flex flex-col gap-2 z-50">
          <div className="flex items-center gap-2 text-base font-handwritten font-bold uppercase tracking-wider text-purple-300">
            <PenLine className="size-5" />
            {t("impostorGuess.title")}
          </div>
          <ImpostorGuessForm attemptsLeft={attemptsLeft} />
        </div>
      )}
    </div>
  );
};
