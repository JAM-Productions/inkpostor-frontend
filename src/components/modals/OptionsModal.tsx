import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  Clock3,
  Droplets,
  Eraser,
  EyeOff,
  Flag,
  List,
  ListOrdered,
  Lock,
  Palette,
  PenLine,
  Minus,
  Plus,
  Settings,
  Shuffle,
} from "lucide-react";
import { BaseModal } from "./BaseModal";
import { GameModeCarousel } from "./GameModeCarousel";
import { useGameStore, type TurnOrderMode } from "../../store/gameState";
import {
  DRAWING_OPTION_SECTIONS,
  MAX_IMPOSTOR_GUESSES,
  MIN_IMPOSTOR_GUESSES,
  MODE_LOCKED_OPTIONS,
  MODE_OPTION_SECTIONS,
  type OptionSection,
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
  const savedGameMode = useGameStore((state) => state.gameMode);
  const actions = useGameStore((state) => state.actions);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const [roundTime, setRoundTime] = useState(gameOptions.roundTime);
  const [unlimitedInk, setUnlimitedInk] = useState(gameOptions.unlimitedInk);
  const [clearCanvasEachRound, setClearCanvasEachRound] = useState(
    gameOptions.clearCanvasEachRound,
  );
  const [playerColorsEnabled, setPlayerColorsEnabled] = useState(
    gameOptions.playerColorsEnabled,
  );
  const [impostorGuessEnabled, setImpostorGuessEnabled] = useState(
    gameOptions.impostorGuessEnabled,
  );
  const [impostorGuessAttempts, setImpostorGuessAttempts] = useState(
    gameOptions.impostorGuessAttempts,
  );
  const [hideHint, setHideHint] = useState(gameOptions.hideHint);
  const [turnOrderMode, setTurnOrderMode] = useState(gameOptions.turnOrderMode);
  const [stagedGameMode, setStagedGameMode] = useState(savedGameMode);

  const isHost = myId === hostId;
  // Everything below keys off the staged mode, not the saved one: the carousel
  // lives in this modal, so what the host is looking at is what the locks and
  // the visible sections must follow. A guest has nothing staged.
  const gameMode = isHost ? stagedGameMode : savedGameMode;
  // A mode can take an option over: its value is forced and the host cannot
  // change it while the mode is selected. The server enforces the same table.
  // Defaults to no locks so a mode this client doesn't know yet (server deployed
  // first) renders the plain options instead of blowing up the modal.
  const lockedOptions = MODE_LOCKED_OPTIONS[gameMode] ?? {};
  // A mode can also replace options instead of locking them: ORIGINAL has no
  // canvas, so the drawing settings aren't shown with a padlock, they simply
  // aren't there. Same fallback reasoning as above for an unknown mode.
  const visibleSections =
    MODE_OPTION_SECTIONS[gameMode] ?? DRAWING_OPTION_SECTIONS;
  const shows = (section: OptionSection) => visibleSections.includes(section);
  const modeName = t(
    GAME_MODES.find((mode) => mode.id === gameMode)?.nameKey ?? "",
  );
  // Every one of these has to go through lockedOptions, not just the ones the
  // modal renders with a padlock: the carousel lives in this same modal, so the
  // staged value can belong to the mode the host just swiped away from.
  const displayedRoundTime =
    lockedOptions.roundTime ?? (isHost ? roundTime : gameOptions.roundTime);
  const displayedUnlimitedInk =
    lockedOptions.unlimitedInk ??
    (isHost ? unlimitedInk : gameOptions.unlimitedInk);
  const displayedClearCanvasEachRound =
    lockedOptions.clearCanvasEachRound ??
    (isHost ? clearCanvasEachRound : gameOptions.clearCanvasEachRound);
  const displayedPlayerColorsEnabled =
    lockedOptions.playerColorsEnabled ??
    (isHost ? playerColorsEnabled : gameOptions.playerColorsEnabled);
  const displayedImpostorGuessEnabled =
    lockedOptions.impostorGuessEnabled ??
    (isHost ? impostorGuessEnabled : gameOptions.impostorGuessEnabled);
  const displayedImpostorGuessAttempts =
    lockedOptions.impostorGuessAttempts ??
    (isHost ? impostorGuessAttempts : gameOptions.impostorGuessAttempts);
  const displayedHideHint =
    lockedOptions.hideHint ?? (isHost ? hideHint : gameOptions.hideHint);
  const displayedTurnOrderMode = isHost
    ? turnOrderMode
    : gameOptions.turnOrderMode;
  const isClearCanvasLocked = "clearCanvasEachRound" in lockedOptions;
  const isImpostorGuessLocked = "impostorGuessEnabled" in lockedOptions;

  const turnOrderOptions: {
    value: TurnOrderMode;
    label: string;
    hint: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "RANDOM_STARTER",
      label: t("options.turnOrder.randomStarter"),
      hint: t("options.turnOrder.randomStarterHint"),
      icon: <Flag className="size-4" />,
    },
    {
      value: "FIXED_ORDER",
      label: t("options.turnOrder.fixedOrder"),
      hint: t("options.turnOrder.fixedOrderHint"),
      icon: <List className="size-4" />,
    },
    {
      value: "RANDOM_ORDER",
      label: t("options.turnOrder.randomOrder"),
      hint: t("options.turnOrder.randomOrderHint"),
      icon: <Shuffle className="size-4" />,
    },
  ];
  const selectedTurnOrder =
    turnOrderOptions.find(
      (option) => option.value === displayedTurnOrderMode,
    ) ?? turnOrderOptions[0];

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
                gameMode: stagedGameMode,
                roundTime: displayedRoundTime,
                unlimitedInk: displayedUnlimitedInk,
                clearCanvasEachRound: displayedClearCanvasEachRound,
                playerColorsEnabled: displayedPlayerColorsEnabled,
                impostorGuessEnabled: displayedImpostorGuessEnabled,
                impostorGuessAttempts: displayedImpostorGuessAttempts,
                hideHint: displayedHideHint,
                turnOrderMode: displayedTurnOrderMode,
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
        <GameModeCarousel
          isHost={isHost}
          gameMode={gameMode}
          onChange={setStagedGameMode}
        />

        {shows("hideHint") && (
          <section
            className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5"
            data-testid="hide-hint-section"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-3 justify-center items-center">
                <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 h-fit">
                  <EyeOff className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                    {t("options.hideHint.title")}
                  </h3>
                  <p className="mt-1 text-sm text-stone-400">
                    {t("options.hideHint.description")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                disabled={!isHost}
                aria-checked={displayedHideHint}
                onClick={() => setHideHint(!hideHint)}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors ${
                  displayedHideHint
                    ? "border-indigo-400/50 bg-indigo-500"
                    : "border-stone-700 bg-stone-700"
                } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}
                aria-label={t("options.hideHint.toggle")}
              >
                <span
                  className={`inline-block size-6 transform rounded-full bg-white shadow-sm transition-transform ${
                    displayedHideHint ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>
        )}

        {shows("turnOrder") && (
          <section
            className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5"
            data-testid="turn-order-section"
          >
            <div className="flex gap-3">
              <div className="rounded-xl bg-teal-500/10 p-2 text-teal-400 h-fit">
                <ListOrdered className="size-5" />
              </div>
              <div className="w-full">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  {t("options.turnOrder.title")}
                </h3>
                <p className="mt-1 text-sm text-stone-400">
                  {t("options.turnOrder.description")}
                </p>
                {isHost ? (
                  <div
                    className="mt-4 grid grid-cols-1 gap-3"
                    role="radiogroup"
                    aria-label={t("options.turnOrder.title")}
                  >
                    {turnOrderOptions.map((option) => {
                      const isSelected =
                        option.value === displayedTurnOrderMode;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTurnOrderMode(option.value)}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "border-ink-primary bg-ink-primary/10 text-white"
                              : "border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-600 hover:text-white"
                          }`}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 font-semibold">
                              {option.icon}
                              {option.label}
                            </span>
                            <span className="mt-1 block text-sm text-stone-400">
                              {option.hint}
                            </span>
                          </span>
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
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
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-semibold">
                        {selectedTurnOrder.icon}
                        {selectedTurnOrder.label}
                      </span>
                      <span className="mt-1 block text-sm text-stone-400">
                        {selectedTurnOrder.hint}
                      </span>
                    </span>
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-ink-primary bg-ink-primary/20">
                      <Check className="size-3.5 text-ink-primary" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {shows("time") && (
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
        )}

        {shows("unlimitedInk") && (
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
        )}

        {shows("playerColors") && (
          <section className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-3 justify-center items-center">
                <div className="rounded-xl bg-pink-500/10 p-2 text-pink-400 h-fit">
                  <Palette className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                    {t("options.playerColors.title")}
                  </h3>
                  <p className="mt-1 text-sm text-stone-400">
                    {t("options.playerColors.description")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                disabled={!isHost}
                aria-checked={displayedPlayerColorsEnabled}
                onClick={() => setPlayerColorsEnabled(!playerColorsEnabled)}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors ${
                  displayedPlayerColorsEnabled
                    ? "border-pink-400/50 bg-pink-500"
                    : "border-stone-700 bg-stone-700"
                } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}
                aria-label={t("options.playerColors.toggle")}
              >
                <span
                  className={`inline-block size-6 transform rounded-full bg-white shadow-sm transition-transform ${
                    displayedPlayerColorsEnabled
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>
        )}

        {shows("clearCanvas") && (
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
        )}

        {shows("impostorGuess") && (
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
        )}
      </div>
    </BaseModal>
  );
};
