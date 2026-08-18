import React from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle } from "lucide-react";
import { useGameStore } from "../../store/gameState";
import { getPlayerIconColorClass } from "../../lib/playerColors";

interface CanvasPreviewAuthorCardProps {
  /** `null` for the part of the drawing nobody can be credited with. */
  playerId: string | null;
  /** Drawing right now, while the replay runs. */
  isActive: boolean;
  /** Singled out on the canvas. */
  isIsolated: boolean;
  /** Someone else is singled out, so this one is standing back. */
  isMuted: boolean;
  /** Left out while the replay runs, and for the unattributed part. */
  onSelect?: () => void;
}

/**
 * One player in the preview's cast list: who drew, and the handle for singling
 * their part of the drawing out.
 *
 * A player who has since left the room is still in the drawing and still gets a
 * card; there is just no name left to put on it.
 */
export const CanvasPreviewAuthorCard: React.FC<
  CanvasPreviewAuthorCardProps
> = ({ playerId, isActive, isIsolated, isMuted, onSelect }) => {
  const { t } = useTranslation();
  const players = useGameStore((state) => state.players);
  const hostId = useGameStore((state) => state.hostId);

  const player = playerId ? players.find((p) => p.id === playerId) : undefined;
  const testId = `preview-author-${playerId ?? "unknown"}`;

  const className = `flex min-w-0 items-center gap-2 rounded-[14px_5px_16px_5px] border-2 px-2.5 py-1.5 transition-colors ${
    isActive
      ? "border-amber-400 bg-amber-100/15 text-white shadow-[3px_3px_0px_#000] -rotate-1"
      : isIsolated
        ? "border-ink-primary bg-amber-100/15 text-white shadow-[3px_3px_0px_#000] -rotate-1"
        : isMuted
          ? "border-stone-800 bg-[#181512] text-amber-100/40 shadow-none"
          : "border-stone-800 bg-[#181512] text-amber-100/90 shadow-[2px_2px_0px_#000]"
  }`;

  const content = (
    <>
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-stone-950 font-handwritten text-sm font-bold shadow-[2px_2px_0px_#000] sm:size-9 sm:text-base ${
          player
            ? getPlayerIconColorClass(player.id, hostId, players)
            : "bg-stone-700 text-stone-300"
        }`}
      >
        {player ? (
          player.name.charAt(0).toUpperCase()
        ) : (
          <HelpCircle className="size-4" />
        )}
      </div>
      <span className="truncate font-handwritten text-sm font-bold sm:text-base">
        {player?.name ?? t("canvasPreview.unknownArtist")}
      </span>
    </>
  );

  if (!onSelect) {
    return (
      <div data-testid={testId} className={`${className} cursor-default`}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={isIsolated}
      onClick={onSelect}
      className={`${className} cursor-pointer hover:-rotate-1 hover:border-amber-400/70`}
    >
      {content}
    </button>
  );
};
