import React from "react";
import { useGameStore } from "../../store/gameState";
import { getPlayerIconColorClass } from "../../lib/playerColors";

interface CanvasPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Who is drawing right now; `null` once the replay is over. */
  currentAuthorId: string | null;
  /**
   * Gives back some height on small screens, for when the round carousel is
   * sharing the modal. Without it the sheet takes everything and the modal
   * ends up a few pixels too tall to fit.
   */
  compact?: boolean;
}

/**
 * The replay surface: the same sheet of paper the round was drawn on, with the
 * player currently drawing named in the corner.
 *
 * The picture itself is painted by {@link useCanvasReplay}, which owns both refs.
 */
export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  canvasRef,
  containerRef,
  currentAuthorId,
  compact = false,
}) => {
  const players = useGameStore((state) => state.players);
  const hostId = useGameStore((state) => state.hostId);
  const currentAuthor = players.find((p) => p.id === currentAuthorId);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        data-testid="canvas-preview-surface"
        className={`relative w-full overflow-hidden rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 border-stone-950 bg-[#F4ECD8] shadow-[6px_6px_0px_#0c0b09] sm:aspect-video sm:h-auto ${
          compact ? "h-[47vh]" : "h-[55vh]"
        }`}
      >
        <canvas ref={canvasRef} className="size-full" />
      </div>

      {currentAuthor && (
        <div
          data-testid="canvas-preview-current-author"
          className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-[14px_4px_16px_4px] border-2 border-stone-950 bg-ink-surface p-1.5 pr-3 shadow-[3px_3px_0px_#0c0b09]"
        >
          <div
            className={`flex size-7 items-center justify-center rounded-full border-2 border-stone-950 font-handwritten text-sm font-bold ${getPlayerIconColorClass(currentAuthor.id, hostId, players)}`}
          >
            {currentAuthor.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-handwritten text-sm font-bold text-white sm:text-base">
            {currentAuthor.name}
          </span>
        </div>
      )}
    </div>
  );
};
