import React, { useRef, useState } from "react";
import { Volume2, Volume1, VolumeX, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSoundStore } from "../../store/soundStore";
import { useClickOutside } from "../../hooks/useClickOutside";
import { OptionSwitch } from "../modals/options/OptionSwitch";

export function SoundToggleButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const muted = useSoundStore((state) => state.muted);
  const volume = useSoundStore((state) => state.volume);
  const actions = useSoundStore((state) => state.actions);

  const percentage = Math.round(volume * 100);
  const isMutedOrSilent = muted || volume <= 0;

  useClickOutside(dropdownRef, isOpen, setIsOpen);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    actions.setVolume(val);
  };

  const renderVolumeIcon = () => {
    if (isMutedOrSilent) {
      return <VolumeX className="size-4 text-stone-500" />;
    }
    if (percentage < 50) {
      return <Volume1 className="size-4 text-amber-300" />;
    }
    return <Volume2 className="size-4 text-amber-300" />;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        data-testid="sound-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-2 sm:p-2.5 rounded-[14px_4px_16px_5px] border-2 border-stone-950 text-white transition-colors cursor-pointer shadow-[3px_3px_0px_#0c0b09] hover:-rotate-2 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] flex items-center justify-center ${
          isOpen
            ? "bg-amber-400 text-stone-950 -rotate-1"
            : "bg-ink-surface hover:bg-stone-800"
        }`}
        aria-label={t("topbar.soundSettings")}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {isMutedOrSilent ? (
          <VolumeX
            className={`size-4 ${isOpen ? "text-stone-950" : "text-stone-400"}`}
          />
        ) : (
          <Volume2
            className={`size-4 ${isOpen ? "text-stone-950" : "text-amber-300"}`}
          />
        )}
      </button>

      {isOpen && (
        <div
          data-testid="sound-popover"
          className="absolute right-0 mt-2 sm:mt-3 w-64 p-3.5 bg-ink-surface border-3 border-stone-950 rounded-[18px_6px_20px_6px] shadow-[6px_6px_0px_#0c0b09] flex flex-col gap-3 z-50 animate-fade-in-up"
        >
          {/* Header & Master Audio Switch */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-amber-300" />
              <span className="font-handwritten font-bold text-base text-white uppercase tracking-wider">
                {t("options.sound.title")}
              </span>
            </div>
            <OptionSwitch
              checked={!muted}
              disabled={false}
              label={t("options.sound.toggleMute")}
              onChange={actions.toggleMute}
              tone="amber"
            />
          </div>

          {/* Volume Slider row */}
          <div className="flex items-center gap-2.5 pt-1">
            <span className="shrink-0">{renderVolumeIcon()}</span>
            <label htmlFor="sound-volume-slider" className="sr-only">
              {t("options.sound.volumeSlider")}
            </label>
            <input
              id="sound-volume-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={muted ? 0 : percentage}
              disabled={muted}
              onChange={handleVolumeChange}
              data-testid="sound-volume-slider"
              aria-label={t("options.sound.volumeSlider")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={muted ? 0 : percentage}
              className="w-full h-2.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <span
              data-testid="sound-volume-value"
              className="w-10 text-right font-handwritten text-sm font-bold text-amber-100"
            >
              {muted ? "0%" : `${percentage}%`}
            </span>
          </div>

          {/* Test Sound button */}
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={() => actions.playSound("testSound")}
              disabled={muted || percentage === 0}
              data-testid="sound-test-btn"
              className="flex items-center gap-1.5 px-3 py-1 rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-[#181512] text-amber-200 hover:bg-stone-800 text-xs font-handwritten font-bold shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <Play className="size-3 fill-current text-amber-300" />
              <span>{t("options.sound.test")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
