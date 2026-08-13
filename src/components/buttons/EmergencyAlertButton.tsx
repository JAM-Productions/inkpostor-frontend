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

  if (me?.isEjected) return null;

  return (
    <div className="sm:relative" ref={dropdownRef}>
      <button
        type="button"
        data-testid="emergency-alert-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-center size-11 sm:h-12 sm:w-16 md:h-13 rounded-[14px_4px_16px_5px] border-3 border-stone-950 font-bold transition-all shadow-[4px_4px_0px_#0c0b09] hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer text-white ${
          isOpen ? "bg-red-700" : "bg-red-600 hover:bg-red-500"
        } ${isDisabled ? "opacity-50 hover:rotate-0" : ""}`}
        aria-label="Alert"
        disabled={isDisabled}
      >
        <TriangleAlert className="size-6 text-amber-300 drop-shadow-sm" />
      </button>

      {isOpen && (
        <div className="absolute top-full inset-x-0 sm:inset-x-auto sm:left-auto sm:right-0 mt-3 p-4 bg-[#26221d] rounded-[20px_8px_18px_6px] border-3 border-stone-950 shadow-[6px_6px_0px_#0c0b09] flex flex-col gap-4 sm:min-w-64 animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-200 z-50">
          <p className="text-base text-amber-100 font-handwritten font-bold text-center">
            {t("canvas.emergencyVotingPrompt")}
          </p>
          <button
            type="button"
            data-testid="confirm-emergency-btn"
            onClick={() => {
              setIsOpen(false);
              actions.startEmergencyVoting();
            }}
            disabled={isDisabled}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 border-2 border-stone-950 text-white font-handwritten text-lg font-bold rounded-[14px_5px_16px_4px] shadow-[3px_3px_0px_#0c0b09] hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] transition-all cursor-pointer"
          >
            {t("canvas.confirm")}
          </button>
        </div>
      )}
    </div>
  );
};
