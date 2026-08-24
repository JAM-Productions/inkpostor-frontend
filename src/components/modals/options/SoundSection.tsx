import React from "react";
import { Volume2, Volume1, VolumeX, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSoundStore } from "../../../store/soundStore";
import { OptionSwitch } from "./OptionSwitch";

export const SoundSection: React.FC = () => {
  const { t } = useTranslation();
  const volume = useSoundStore((state) => state.volume);
  const muted = useSoundStore((state) => state.muted);
  const actions = useSoundStore((state) => state.actions);

  const percentage = Math.round(volume * 100);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    actions.setVolume(val);
  };

  const renderVolumeIcon = () => {
    if (muted || percentage === 0) {
      return <VolumeX className="size-5 text-stone-500" />;
    }
    if (percentage < 50) {
      return <Volume1 className="size-5 text-amber-300" />;
    }
    return <Volume2 className="size-5 text-amber-300" />;
  };

  return (
    <section
      className="rounded-[18px_6px_20px_7px] border-2 border-stone-950 bg-[#181512] p-4 sm:p-5 shadow-[3px_3px_0px_#0c0b09]"
      data-testid="sound-section"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-3 items-start">
          <div className="rounded-[12px_4px_14px_4px] border-2 border-stone-950 p-2.5 h-fit shadow-[2px_2px_0px_#000] bg-amber-400/10 text-amber-300">
            {muted || percentage === 0 ? (
              <VolumeX className="size-5" />
            ) : (
              <Volume2 className="size-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-handwritten font-bold uppercase tracking-wider text-white">
              {t("options.sound.title")}
            </h3>
            <p className="mt-0.5 text-base font-handwritten text-amber-200/70">
              {t("options.sound.description")}
            </p>
          </div>
        </div>
        <OptionSwitch
          checked={muted}
          disabled={false}
          label={t("options.sound.toggleMute")}
          onChange={actions.toggleMute}
          tone="red"
        />
      </div>

      <div className="mt-4 pt-3 border-t border-stone-800 space-y-3">
        <div className="flex items-center gap-3">
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
            className="w-12 text-right font-handwritten text-base font-bold text-amber-100"
          >
            {muted ? "0%" : `${percentage}%`}
          </span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => actions.playSound("testSound")}
            disabled={muted || percentage === 0}
            data-testid="sound-test-btn"
            className="flex items-center gap-2 px-3 py-1.5 rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-ink-surface text-amber-200 hover:bg-stone-800 text-sm font-handwritten font-bold shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <Play className="size-3.5 fill-current" />
            <span>{t("options.sound.test")}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
