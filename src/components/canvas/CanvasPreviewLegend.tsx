import React from "react";
import { useTranslation } from "react-i18next";
import { CanvasPreviewAuthorCard } from "./CanvasPreviewAuthorCard";

interface CanvasPreviewLegendProps {
  authorIds: string[];
  hasUnknown: boolean;
  /** Who is drawing right now; `null` once the replay is over. */
  currentAuthorId: string | null;
  isolatedPlayerId: string | null;
  /** While the replay runs the cards only report, they don't take clicks. */
  isPlaying: boolean;
  onIsolate: (playerId: string | null) => void;
}

/**
 * Who drew the drawing, in the order they took their turn. Follows the replay
 * while it runs, and turns into the controls for singling a player out once it
 * is over.
 */
export const CanvasPreviewLegend: React.FC<CanvasPreviewLegendProps> = ({
  authorIds,
  hasUnknown,
  currentAuthorId,
  isolatedPlayerId,
  isPlaying,
  onIsolate,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div
        data-testid="canvas-preview-legend"
        className="flex flex-wrap justify-center gap-2"
      >
        {authorIds.map((playerId) => (
          <CanvasPreviewAuthorCard
            key={playerId}
            playerId={playerId}
            isActive={isPlaying && currentAuthorId === playerId}
            isIsolated={!isPlaying && isolatedPlayerId === playerId}
            isMuted={
              !isPlaying &&
              isolatedPlayerId !== null &&
              isolatedPlayerId !== playerId
            }
            onSelect={
              isPlaying
                ? undefined
                : () =>
                    onIsolate(isolatedPlayerId === playerId ? null : playerId)
            }
          />
        ))}

        {hasUnknown && (
          <CanvasPreviewAuthorCard
            playerId={null}
            isActive={false}
            isIsolated={false}
            isMuted={!isPlaying && isolatedPlayerId !== null}
          />
        )}
      </div>

      <p className="text-center font-handwritten text-sm font-bold text-stone-400">
        {isPlaying
          ? t("canvasPreview.drawingNow")
          : isolatedPlayerId !== null
            ? t("canvasPreview.showAllHint")
            : t("canvasPreview.isolateHint")}
      </p>
    </div>
  );
};
