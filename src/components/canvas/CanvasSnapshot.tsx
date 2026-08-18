import React from "react";
import { useGameStore } from "../../store/gameState";
import { useCanvasSnapshot } from "../../hooks/useCanvasSnapshot";

interface CanvasSnapshotProps {
  /** Height of the sheet on small screens. The desktop one stays 16:9. */
  heightClass?: string;
}

/**
 * The round's drawing, standing still: the sheet and nothing else.
 *
 * No cast list, no rounds, no replay — it is not the thing being done on the
 * screens that show it, it is what they are about. Renders nothing at all when
 * there is no drawing, so a spoken mode never shows an empty sheet.
 */
export const CanvasSnapshot: React.FC<CanvasSnapshotProps> = ({
  heightClass = "h-[32vh]",
}) => {
  const canvasStrokes = useGameStore((state) => state.canvasStrokes);
  const { canvasRef, containerRef } = useCanvasSnapshot(canvasStrokes);

  if (canvasStrokes.length === 0) return null;

  return (
    <div
      ref={containerRef}
      data-testid="canvas-snapshot"
      className={`relative w-full overflow-hidden rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 border-stone-950 bg-[#F4ECD8] shadow-[5px_5px_0px_#0c0b09] sm:aspect-video sm:h-auto ${heightClass}`}
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};
