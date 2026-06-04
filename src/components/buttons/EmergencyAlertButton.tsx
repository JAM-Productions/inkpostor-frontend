import { useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useGameStore } from "../../store/gameState";

export const EmergencyAlertButton = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const actions = useGameStore((state) => state.actions);
  const players = useGameStore((state) => state.players);
  const myId = useGameStore((state) => state.myId);

  const me = players.find((p) => p.id === myId);
  const isDisabled = me?.hasStartedEmergencyVoting;

  useClickOutside(dropdownRef, isOpen, setIsOpen);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center px-4 py-2 sm:px-5 sm:py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-red-900/50 cursor-pointer ${isOpen ? "bg-ink-primary-accent" : "bg-ink-primary"} ${isDisabled ? "opacity-50" : "hover:bg-ink-primary-accent"}`}
        aria-label="Alert"
        disabled={isDisabled}
      >
        <TriangleAlert className="size-5" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 p-3 bg-stone-800 rounded-2xl border border-stone-700 shadow-2xl flex flex-col gap-4 min-w-50 sm:min-w-60 animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-200 z-50">
          <p className="text-sm text-white font-semibold text-center">
            {t("canvas.emergencyVotingPrompt")}
          </p>
          <button
            onClick={() => {
              setIsOpen(false);
              actions.startEmergencyVoting();
            }}
            disabled={isDisabled}
            className="px-4 py-2 bg-ink-primary hover:bg-ink-primary-accent cursor-pointer text-white font-bold rounded-xl transition-all"
          >
            {t("canvas.confirm")}
          </button>
        </div>
      )}
    </div>
  );
};
