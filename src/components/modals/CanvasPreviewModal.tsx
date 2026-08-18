import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Scroll } from "lucide-react";
import { BaseModal } from "./BaseModal";
import { useGameStore } from "../../store/gameState";
import { buildAuthorRuns, getAuthorOrder } from "../../lib/strokeAuthors";
import { buildRoundSegments, getRoundSpans } from "../../lib/strokeRounds";
import { useCanvasReplay } from "../../hooks/useCanvasReplay";
import { CanvasPreview } from "../canvas/CanvasPreview";
import { CanvasPreviewLegend } from "../canvas/CanvasPreviewLegend";
import { CanvasReplayButton } from "../canvas/CanvasReplayButton";
import { CanvasRoundSelector } from "../canvas/CanvasRoundSelector";

interface CanvasPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The drawing, replayed stroke by stroke and then broken down by who drew what
 * — the case file the vote is cast on.
 *
 * A canvas the host chose to keep between rounds holds all of them at once, so
 * one round is replayed at a time and the newest opens.
 */
export const CanvasPreviewModal: React.FC<CanvasPreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const canvasStrokes = useGameStore((state) => state.canvasStrokes);
  const [isolatedPlayerId, setIsolatedPlayerId] = useState<string | null>(null);
  const [pickedRound, setPickedRound] = useState<number | null | undefined>();

  const spans = useMemo(
    () => getRoundSpans(buildRoundSegments(canvasStrokes)),
    [canvasStrokes],
  );

  // Nothing is picked until the player picks: the newest round is whatever the
  // drawing ends on, and that stays right as the rounds go by.
  const newestRound = spans[spans.length - 1]?.round ?? null;
  const selectedRound = pickedRound === undefined ? newestRound : pickedRound;

  const { strokes, backdrop } = useMemo(() => {
    // One round is the whole drawing, and slicing it would only make a copy.
    if (spans.length <= 1) return { strokes: canvasStrokes, backdrop: [] };
    const span = spans.find((candidate) => candidate.round === selectedRound);
    if (!span) return { strokes: canvasStrokes, backdrop: [] };
    return {
      strokes: canvasStrokes.slice(span.start, span.end),
      // What the round opened on: everything drawn before it, kept faint
      // underneath so this round reads as what was added to that.
      backdrop: canvasStrokes.slice(0, span.start),
    };
  }, [canvasStrokes, spans, selectedRound]);

  const runs = useMemo(() => buildAuthorRuns(strokes), [strokes]);
  const { playerIds, hasUnknown } = useMemo(() => getAuthorOrder(runs), [runs]);

  // Framed on the whole canvas, not on the round being replayed: a round shown
  // on its own has to stay where it was drawn, at the size it was drawn.
  const { canvasRef, containerRef, status, currentAuthorId, replay } =
    useCanvasReplay(strokes, runs, isolatedPlayerId, canvasStrokes, backdrop);

  const isPlaying = status === "playing";

  const handleReplay = useCallback(() => {
    // The drawing goes back to being whole before it is drawn again: replaying
    // it with one player still singled out would animate a picture with holes.
    setIsolatedPlayerId(null);
    replay();
  }, [replay]);

  const handlePickRound = useCallback((round: number | null) => {
    // A round of its own to look at, so the singling out starts over with it.
    setIsolatedPlayerId(null);
    setPickedRound(round);
  }, []);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      id="canvas-preview-modal"
      title={t("canvasPreview.title")}
      icon={<Scroll className="size-6" />}
      closeLabel={t("canvasPreview.closeDialog")}
      footer={<CanvasReplayButton isPlaying={isPlaying} onClick={handleReplay} />}
    >
      {canvasStrokes.length === 0 ? (
        <p
          data-testid="canvas-preview-empty"
          className="py-8 text-center font-handwritten text-xl font-bold text-stone-400"
        >
          {t("canvasPreview.empty")}
        </p>
      ) : (
        <div className="space-y-4">
          {spans.length > 1 && (
            <CanvasRoundSelector
              rounds={spans.map((span) => span.round)}
              selectedRound={selectedRound}
              onSelect={handlePickRound}
            />
          )}

          <CanvasPreview
            canvasRef={canvasRef}
            containerRef={containerRef}
            currentAuthorId={isPlaying ? currentAuthorId : null}
            compact={spans.length > 1}
          />

          <CanvasPreviewLegend
            authorIds={playerIds}
            hasUnknown={hasUnknown}
            currentAuthorId={currentAuthorId}
            isolatedPlayerId={isolatedPlayerId}
            isPlaying={isPlaying}
            onIsolate={setIsolatedPlayerId}
          />

        </div>
      )}
    </BaseModal>
  );
};
