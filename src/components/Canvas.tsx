import { useGameStore } from "../store/gameState";
import { useTurnTimer } from "../hooks/useTurnTimer";
import { useCanvasDrawing } from "../hooks/useCanvasDrawing";
import { CanvasHeader } from "./canvas/CanvasHeader";
import { DrawingCanvas } from "./canvas/DrawingCanvas";
import { DrawingToolbar } from "./canvas/DrawingToolbar";

/**
 * Drawing phase screen. Wires the turn timer and the drawing logic together and
 * composes the header, the drawing surface and the active-player toolbar.
 *
 * The heavy lifting lives in dedicated pieces:
 * - {@link useTurnTimer} / {@link useCanvasDrawing} for the logic.
 * - {@link CanvasHeader} / {@link DrawingCanvas} / {@link DrawingToolbar} for UI.
 */
export const Canvas: React.FC = () => {
  const myId = useGameStore((state) => state.myId);
  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const isMyTurn = currentTurnPlayerId === myId;

  const timeLeft = useTurnTimer();
  const drawing = useCanvasDrawing();

  return (
    <div className="flex flex-col items-center bg-stone-900 p-2 md:p-6 pb-24 sm:justify-center mt-12">
      <div className="w-full max-w-4xl space-y-4">
        <CanvasHeader timeLeft={timeLeft} />

        <DrawingCanvas
          canvasRef={drawing.canvasRef}
          containerRef={drawing.containerRef}
          isMyTurn={isMyTurn}
          isOutOfInk={drawing.isOutOfInk}
          onStartDrawing={drawing.startDrawing}
          timeLeft={timeLeft}
        />

        {isMyTurn && (
          <DrawingToolbar
            color={drawing.color}
            onColorChange={drawing.setColor}
            onUndo={drawing.undoLastStroke}
            inkPercentage={drawing.inkPercentage}
            isOutOfInk={drawing.isOutOfInk}
          />
        )}
      </div>
    </div>
  );
};
