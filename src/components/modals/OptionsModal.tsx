import React, { useState } from "react";
import { Droplets, EyeOff, Palette, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BaseModal } from "./BaseModal";
import { GameModeCarousel } from "./GameModeCarousel";
import { ClearCanvasSection } from "./options/ClearCanvasSection";
import { ImpostorGuessSection } from "./options/ImpostorGuessSection";
import { OptionsFooter } from "./options/OptionsFooter";
import { RoundTimeSection } from "./options/RoundTimeSection";
import { ToggleOptionSection } from "./options/ToggleOptionSection";
import { TurnOrderSection } from "./options/TurnOrderSection";
import {
  applyModeLockedOptions,
  DEFAULT_GAME_MODE,
  DEFAULT_GAME_OPTIONS,
  DRAWING_OPTION_SECTIONS,
  MAX_IMPOSTOR_GUESSES,
  MIN_IMPOSTOR_GUESSES,
  MODE_LOCKED_OPTIONS,
  MODE_OPTION_SECTIONS,
  type OptionSection,
} from "../../lib/constants";
import { GAME_MODES } from "../../lib/gameModes";
import { useGameStore, type GameOptions } from "../../store/gameState";

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const hostGameOptions = useGameStore((state) => state.hostGameOptions);
  const savedGameMode = useGameStore((state) => state.gameMode);
  const actions = useGameStore((state) => state.actions);
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const [roundTime, setRoundTime] = useState(hostGameOptions.roundTime);
  const [unlimitedInk, setUnlimitedInk] = useState(
    hostGameOptions.unlimitedInk,
  );
  const [clearCanvasEachRound, setClearCanvasEachRound] = useState(
    hostGameOptions.clearCanvasEachRound,
  );
  const [playerColorsEnabled, setPlayerColorsEnabled] = useState(
    hostGameOptions.playerColorsEnabled,
  );
  const [impostorGuessEnabled, setImpostorGuessEnabled] = useState(
    hostGameOptions.impostorGuessEnabled,
  );
  const [impostorGuessAttempts, setImpostorGuessAttempts] = useState(
    hostGameOptions.impostorGuessAttempts,
  );
  const [impostorLosesWhenOutOfGuesses, setImpostorLosesWhenOutOfGuesses] =
    useState(hostGameOptions.impostorLosesWhenOutOfGuesses);
  const [hideHint, setHideHint] = useState(hostGameOptions.hideHint);
  const [turnOrderMode, setTurnOrderMode] = useState(
    hostGameOptions.turnOrderMode,
  );
  const [stagedGameMode, setStagedGameMode] = useState(savedGameMode);

  const isHost = myId === hostId;
  // The carousel is staged with the rest of the form, so it controls the
  // settings shown in the modal without changing the room until it is saved.
  const gameMode = isHost ? stagedGameMode : savedGameMode;
  const lockedOptions = MODE_LOCKED_OPTIONS[gameMode] ?? {};
  const visibleSections =
    MODE_OPTION_SECTIONS[gameMode] ?? DRAWING_OPTION_SECTIONS;
  const shows = (section: OptionSection) => visibleSections.includes(section);
  const modeName = t(
    GAME_MODES.find((mode) => mode.id === gameMode)?.nameKey ?? "",
  );
  const stagedOptions: GameOptions = isHost
    ? {
        roundTime,
        unlimitedInk,
        clearCanvasEachRound,
        playerColorsEnabled,
        impostorGuessEnabled,
        impostorGuessAttempts,
        // This setting has no meaning while guessing is disabled, so do not
        // leave an invisible choice enabled when saving the modal.
        impostorLosesWhenOutOfGuesses: impostorGuessEnabled
          ? impostorLosesWhenOutOfGuesses
          : DEFAULT_GAME_OPTIONS.impostorLosesWhenOutOfGuesses,
        hideHint,
        turnOrderMode,
      }
    : hostGameOptions;
  const displayed = applyModeLockedOptions(stagedOptions, gameMode);
  const isClearCanvasLocked = "clearCanvasEachRound" in lockedOptions;
  const isImpostorGuessLocked = "impostorGuessEnabled" in lockedOptions;

  const changeImpostorGuessAttempts = (delta: number) => {
    setImpostorGuessAttempts((previous) =>
      Math.min(
        MAX_IMPOSTOR_GUESSES,
        Math.max(MIN_IMPOSTOR_GUESSES, previous + delta),
      ),
    );
  };

  const save = () => {
    actions.updateGameOptions({ gameMode: stagedGameMode, ...stagedOptions });
    onClose();
  };

  const reset = () => {
    actions.updateGameOptions({
      gameMode: DEFAULT_GAME_MODE,
      ...DEFAULT_GAME_OPTIONS,
    });
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      id="options"
      title={t("options.title")}
      closeLabel={t("options.closeDialog")}
      icon={<Settings className="size-6 text-ink-primary" />}
      footer={isHost && <OptionsFooter onConfirm={save} onReset={reset} />}
    >
      <div className="space-y-4">
        <GameModeCarousel
          isHost={isHost}
          gameMode={gameMode}
          onChange={setStagedGameMode}
        />

        {shows("turnOrder") && (
          <TurnOrderSection
            isHost={isHost}
            turnOrderMode={displayed.turnOrderMode}
            onChange={setTurnOrderMode}
          />
        )}
        {shows("time") && (
          <RoundTimeSection
            isHost={isHost}
            roundTime={displayed.roundTime}
            onChange={setRoundTime}
          />
        )}
        {shows("unlimitedInk") && (
          <ToggleOptionSection
            checked={displayed.unlimitedInk}
            disabled={!isHost}
            icon={<Droplets className="size-5" />}
            iconClassName="bg-emerald-500/10 text-emerald-400"
            title={t("options.limitInk.title")}
            description={t("options.limitInk.description")}
            label={t("options.limitInk.toggle")}
            onChange={() => setUnlimitedInk(!unlimitedInk)}
            tone="emerald"
          />
        )}
        {shows("playerColors") && (
          <ToggleOptionSection
            checked={displayed.playerColorsEnabled}
            disabled={!isHost}
            icon={<Palette className="size-5" />}
            iconClassName="bg-pink-500/10 text-pink-400"
            title={t("options.playerColors.title")}
            description={t("options.playerColors.description")}
            label={t("options.playerColors.toggle")}
            onChange={() => setPlayerColorsEnabled(!playerColorsEnabled)}
            tone="pink"
          />
        )}
        {shows("clearCanvas") && (
          <ClearCanvasSection
            checked={displayed.clearCanvasEachRound}
            isHost={isHost}
            isLocked={isClearCanvasLocked}
            modeName={modeName}
            onChange={() => setClearCanvasEachRound(!clearCanvasEachRound)}
          />
        )}
        {shows("impostorGuess") && (
          <ImpostorGuessSection
            attempts={displayed.impostorGuessAttempts}
            enabled={displayed.impostorGuessEnabled}
            isHost={isHost}
            isLocked={isImpostorGuessLocked}
            losesWhenOutOfGuesses={displayed.impostorLosesWhenOutOfGuesses}
            modeName={modeName}
            onAttemptsChange={changeImpostorGuessAttempts}
            onEnabledChange={() =>
              setImpostorGuessEnabled(!impostorGuessEnabled)
            }
            onLosesWhenOutOfGuessesChange={() =>
              setImpostorLosesWhenOutOfGuesses(!impostorLosesWhenOutOfGuesses)
            }
          />
        )}
        {shows("hideHint") && (
          <ToggleOptionSection
            checked={displayed.hideHint}
            disabled={!isHost}
            icon={<EyeOff className="size-5" />}
            iconClassName="bg-indigo-500/10 text-indigo-400"
            title={t("options.hideHint.title")}
            description={t("options.hideHint.description")}
            label={t("options.hideHint.toggle")}
            onChange={() => setHideHint(!hideHint)}
            testId="hide-hint-section"
            tone="indigo"
          />
        )}
      </div>
    </BaseModal>
  );
};
