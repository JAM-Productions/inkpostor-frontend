import { Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSoundStore } from "../../store/soundStore";

export function SoundToggleButton() {
  const { t } = useTranslation();
  const muted = useSoundStore((state) => state.muted);
  const volume = useSoundStore((state) => state.volume);
  const actions = useSoundStore((state) => state.actions);

  const isMutedOrSilent = muted || volume <= 0;

  return (
    <button
      type="button"
      data-testid="sound-toggle-btn"
      onClick={actions.toggleMute}
      className="p-2 sm:p-2.5 rounded-[14px_4px_16px_5px] bg-ink-surface hover:bg-stone-800 border-2 border-stone-950 text-white transition-colors cursor-pointer shadow-[3px_3px_0px_#0c0b09] hover:-rotate-2 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] flex items-center justify-center"
      aria-label={isMutedOrSilent ? t("topbar.unmute") : t("topbar.mute")}
      aria-pressed={!isMutedOrSilent}
    >
      {isMutedOrSilent ? (
        <VolumeX className="size-4 text-stone-400" />
      ) : (
        <Volume2 className="size-4 text-amber-300" />
      )}
    </button>
  );
}
