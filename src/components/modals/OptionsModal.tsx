import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Clock3, Droplets, Eraser, Settings } from "lucide-react";
import { BaseModal } from "./BaseModal";
import { useGameStore } from "../../store/gameState";

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const gameOptions = useGameStore((state) => state.gameOptions);
  const actions = useGameStore((state) => state.actions);
  const phase = useGameStore((state) => state.phase);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const [roundTime, setRoundTime] = useState(gameOptions.roundTime);
  const [unlimitedInk, setUnlimitedInk] = useState(gameOptions.unlimitedInk);
  const [clearCanvasEachRound, setClearCanvasEachRound] = useState(
    gameOptions.clearCanvasEachRound,
  );

  const isHost = myId === hostId;
  const displayedRoundTime = isHost ? roundTime : gameOptions.roundTime;
  const displayedUnlimitedInk = isHost
    ? unlimitedInk
    : gameOptions.unlimitedInk;
  const displayedClearCanvasEachRound = isHost
    ? clearCanvasEachRound
    : gameOptions.clearCanvasEachRound;

  const drawingRoundOptions = [
    { value: 20, label: t("options.time.options.20") },
    { value: 25, label: t("options.time.options.25") },
    { value: 30, label: t("options.time.options.30") },
    { value: 35, label: t("options.time.options.35") },
    { value: 40, label: t("options.time.options.40") },
  ];
  const selectedRoundTime =
    drawingRoundOptions.find((option) => option.value === displayedRoundTime) ??
    drawingRoundOptions[0];

  useEffect(() => {
    if (isOpen && phase !== "LOBBY") {
      onClose();
    }
  }, [phase, isOpen, onClose]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      id="options"
      title={t("options.title")}
      closeLabel={t("options.closeDialog")}
      icon={<Settings className="w-6 h-6 text-ink-primary" />}
      footer={
        isHost && (
          <button
            type="button"
            data-testid="confirm-options-button"
            onClick={() => {
              actions.updateGameOptions({
                roundTime,
                unlimitedInk,
                clearCanvasEachRound,
              });
              onClose();
            }}
            className="w-full py-3 bg-ink-primary hover:bg-ink-primary-accent text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer uppercase"
          >
            {t("options.confirm")}
          </button>
        )
      }
    >
      <div className="space-y-4">
        <section className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5">
          <div className="flex gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 h-fit">
              <Clock3 className="h-5 w-5" />
            </div>
            <div className="w-full">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {t("options.time.title")}
              </h3>
              <p className="mt-1 text-sm text-stone-400">
                {t("options.time.description")}
              </p>
              {isHost ? (
                <div
                  className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
                  role="radiogroup"
                  aria-label={t("options.time.title")}
                >
                  {drawingRoundOptions.map((option) => {
                    const isSelected = option.value === displayedRoundTime;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRoundTime(option.value)}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "border-ink-primary bg-ink-primary/10 text-white"
                            : "border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-600 hover:text-white"
                        }`}
                        role="radio"
                        aria-checked={isSelected}
                      >
                        <span>{option.label}</span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-ink-primary bg-ink-primary/20"
                              : "border-stone-600"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-ink-primary" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-white">
                  <span>{selectedRoundTime.label}</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-ink-primary bg-ink-primary/20">
                    <Check className="h-3.5 w-3.5 text-ink-primary" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-3 justify-center items-center">
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 h-fit">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  {t("options.limitInk.title")}
                </h3>
                <p className="mt-1 text-sm text-stone-400">
                  {t("options.limitInk.description")}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              disabled={!isHost}
              aria-checked={displayedUnlimitedInk}
              onClick={() => setUnlimitedInk(!unlimitedInk)}
              className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors ${
                displayedUnlimitedInk
                  ? "border-emerald-400/50 bg-emerald-500"
                  : "border-stone-700 bg-stone-700"
              } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}
              aria-label={t("options.limitInk.toggle")}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                  displayedUnlimitedInk ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-3 justify-center items-center">
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 h-fit">
                <Eraser className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  {t("options.clearCanvas.title")}
                </h3>
                <p className="mt-1 text-sm text-stone-400">
                  {t("options.clearCanvas.description")}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              disabled={!isHost}
              aria-checked={displayedClearCanvasEachRound}
              onClick={() => setClearCanvasEachRound(!clearCanvasEachRound)}
              className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors ${
                displayedClearCanvasEachRound
                  ? "border-amber-400/50 bg-amber-500"
                  : "border-stone-700 bg-stone-700"
              } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}
              aria-label={t("options.clearCanvas.toggle")}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                  displayedClearCanvasEachRound
                    ? "translate-x-7"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </section>
      </div>
    </BaseModal>
  );
};
