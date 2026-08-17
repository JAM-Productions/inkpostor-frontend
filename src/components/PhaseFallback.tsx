import { useTranslation } from "react-i18next";
import { LoaderCircle } from "lucide-react";

/**
 * Placeholder shown while the chunk of an in-game screen is still downloading.
 *
 * The screens are prefetched as soon as the player is in a room (see
 * `prefetchGameScreens` in App), so in practice this only appears on a cold
 * load over a slow connection, never on a phase change mid-game.
 */
export const PhaseFallback: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="phase-fallback"
      className="flex min-h-screen items-center justify-center bg-ink-bg"
    >
      <LoaderCircle className="size-10 animate-spin text-amber-400" />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
};
