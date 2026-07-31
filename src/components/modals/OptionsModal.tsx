import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  Clock3,
  Droplets,
  Eraser,
  Lock,
  PenLine,
  Minus,
  Plus,
  Settings,
} from "lucide-react";
import { BaseModal } from "./BaseModal";
import { GameModeCarousel } from "./GameModeCarousel";
import { useGameStore } from "../../store/gameState";
import {
  MAX_IMPOSTOR_GUESSES,
  MIN_IMPOSTOR_GUESSES,
  MODE_LOCKED_OPTIONS,
} from "../../lib/constants";
import { GAME_MODES } from "../../lib/gameModes";

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Takes the place of a switch the current mode has taken over. Same footprint,
// so swapping modes doesn't shift the row. Decorative: the reason is spelled out
// in the text next to it.
const ModeLockIndicator: React.FC<{ testId: string }> = ({ testId }) => (
  <div
    className="flex h-8 w-14 shrink-0 items-center justify-center rounded-full border border-stone-700 bg-stone-800 text-stone-500"
    data-testid={testId}
    aria-hidden="true"
  >
    <Lock className="size-4" />
  </div>
);

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const gameOptions = useGameStore((state) => state.gameOptions);
  const gameMode = useGameStore((state) => state.gameMode);
  const actions = useGameStore((state) => state.actions);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const [roundTime, setRoundTime] = useState(gameOptions.roundTime);
  const [unlimitedInk, setUnlimitedInk] = useState(gameOptions.unlimitedInk);
  const [clearCanvasEachRound, setClearCanvasEachRound] = useState(
    gameOptions.clearCanvasEachRound,
  );
  const [impostorGuessEnabled, setImpostorGuessEnabled] = useState(
    gameOptions.impostorGuessEnabled,
  );
  const [impostorGuessAttempts, setImpostorGuessAttempts] = useState(
    gameOptions.impostorGuessAttempts,
  );

  const isHost = myId === hostId;
  // A mode can take an option over: its value is forced and the host cannot
  // change it while the mode is selected. The server enforces the same table.
  // Defaults to no locks so a mode this client doesn't know yet (server deployed
  // first) renders the plain options instead of blowing up the modal.
  const lockedOptions = MODE_LOCKED_OPTIONS[gameMode] ?? {};
  const modeName = t(
    GAME_MODES.find((mode) => mode.id === gameMode)?.nameKey ?? "",
  );
  const displayedRoundTime = isHost ? roundTime : gameOptions.roundTime;
  const displayedUnlimitedInk = isHost
    ? unlimitedInk
    : gameOptions.unlimitedInk;
  const displayedClearCanvasEachRound =
    lockedOptions.clearCanvasEachRound ??
    (isHost ? clearCanvasEachRound : gameOptions.clearCanvasEachRound);
  const displayedImpostorGuessEnabled =
    lockedOptions.impostorGuessEnabled ??
    (isHost ? impostorGuessEnabled : gameOptions.impostorGuessEnabled);
  const displayedImpostorGuessAttempts = isHost
    ? impostorGuessAttempts
    : gameOptions.impostorGuessAttempts;
  const isClearCanvasLocked = "clearCanvasEachRound" in lockedOptions;
  const isImpostorGuessLocked = "impostorGuessEnabled" in lockedOptions;

  const changeImpostorGuessAttempts = (delta: number) => {
    setImpostorGuessAttempts((prev) =>
      Math.min(
        MAX_IMPOSTOR_GUESSES,
        Math.max(MIN_IMPOSTOR_GUESSES, prev + delta),
      ),
    );
  };

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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      id="options"
      title={t("options.title")}
      closeLabel={t("options.closeDialog")}
      icon={<Settings className="size-6 text-ink-primary" />}
      footer={
        isHost && (
          <button
            type="button"
            data-testid="confirm-options-button"
            onClick={() => {
              // The displayed values already carry whatever the mode forces,
              // which matters because the carousel lives in this same modal.
              actions.updateGameOptions({
                roundTime,
                unlimitedInk,
                clearCanvasEachRound: displayedClearCanvasEachRound,
                impostorGuessEnabled: displayedImpostorGuessEnabled,
                impostorGuessAttempts,
              });
              onClose();
            }}
            className="w-full py-3 bg-ink-primary hover:bg-ink-primary-accent text-white font-bold rounded-xl transition-[background-color,scale] active:scale-[0.98] cursor-pointer uppercase"
          >
            {t("options.confirm")}
          </button>
        )
      }
    >
      <div className="space-y-4">
        <GameModeCarousel isHost={isHost} />

        <section className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5">
          <div className="flex gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 h-fit">
              <Clock3 className="size-5" />
            </div>
            <div className="w-full">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
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
                          className={`flex size-5 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-ink-primary bg-ink-primary/20"
                              : "border-stone-600"
                          }`}
                        >
                          {isSelected && (
                            <Check className="size-3.5 text-ink-primary" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-white">
                  <span>{selectedRoundTime.label}</span>
                  <span className="flex size-5 items-center justify-center rounded-full border border-ink-primary bg-ink-primary/20">
                    <Check className="size-3.5 text-ink-primary" />
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
                <Droplets className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
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
                className={`inline-block size-6 transform rounded-full bg-white shadow-sm transition-transform ${
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
                <Eraser className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  {t("options.clearCanvas.title")}
                </h3>
                <p className="mt-1 text-sm text-stone-400">
                  {t("options.clearCanvas.description")}
                </p>
                {isClearCanvasLocked && (
                  <p
                    className="mt-2 text-sm font-medium text-amber-400/90"
                    data-testid="clear-canvas-locked-notice"
                  >
                    {t("options.clearCanvas.alwaysOnInMode", {
                      mode: modeName,
                    })}
                  </p>
                )}
              </div>
            </div>

            {isClearCanvasLocked ? (
              <ModeLockIndicator testId="clear-canvas-locked" />
            ) : (
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
                  className={`inline-block size-6 transform rounded-full bg-white shadow-sm transition-transform ${
                    displayedClearCanvasEachRound
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-3 justify-center items-center">
              <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400 h-fit">
                <PenLine className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  {t("options.impostorGuess.title")}
                </h3>
                <p className="mt-1 text-sm text-stone-400">
                  {t("options.impostorGuess.description")}
                </p>
                {isImpostorGuessLocked && (
                  <p
                    className="mt-2 text-sm font-medium text-amber-400/90"
                    data-testid="impostor-guess-unavailable"
                  >
                    {t("options.impostorGuess.unavailableInMode", {
                      mode: modeName,
                    })}
                  </p>
                )}
              </div>
            </div>

            {!isImpostorGuessLocked ? (
              <button
                type="button"
                role="switch"
                disabled={!isHost}
                aria-checked={displayedImpostorGuessEnabled}
                onClick={() => setImpostorGuessEnabled(!impostorGuessEnabled)}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors ${
                  displayedImpostorGuessEnabled
                    ? "border-purple-400/50 bg-purple-500"
                    : "border-stone-700 bg-stone-700"
                } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}
                aria-label={t("options.impostorGuess.toggle")}
              >
                <span
                  className={`inline-block size-6 transform rounded-full bg-white shadow-sm transition-transform ${
                    displayedImpostorGuessEnabled
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            ) : (
              <ModeLockIndicator testId="impostor-guess-locked" />
            )}
          </div>

          {displayedImpostorGuessEnabled && (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-sm font-semibold text-stone-300">
                {t("options.impostorGuess.attempts")}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={
                    !isHost ||
                    displayedImpostorGuessAttempts <= MIN_IMPOSTOR_GUESSES
                  }
                  onClick={() => changeImpostorGuessAttempts(-1)}
                  className="flex size-8 items-center justify-center rounded-lg border border-stone-600 bg-stone-800 text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  aria-label={t("options.impostorGuess.decrease")}
                >
                  <Minus className="size-4" />
                </button>
                <span
                  className="w-6 text-center text-lg font-bold tabular-nums text-white"
                  aria-live="polite"
                >
                  {displayedImpostorGuessAttempts}
                </span>
                <button
                  type="button"
                  disabled={
                    !isHost ||
                    displayedImpostorGuessAttempts >= MAX_IMPOSTOR_GUESSES
                  }
                  onClick={() => changeImpostorGuessAttempts(1)}
                  className="flex size-8 items-center justify-center rounded-lg border border-stone-600 bg-stone-800 text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  aria-label={t("options.impostorGuess.increase")}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </BaseModal>
  );
};
