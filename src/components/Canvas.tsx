import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "../store/gameState";
import { Eraser, CheckSquare, Clock } from "lucide-react";

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#1a1a1a"); // Dark ink default

  // Limits
  const MAX_INK = 2000;
  const TURN_TIME_MS = 15000; // 15 seconds
  const [inkUsed, setInkUsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME_MS);

  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const canvasStrokes = useGameStore((state) => state.canvasStrokes);
  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const myId = useGameStore((state) => state.myId);
  const players = useGameStore((state) => state.players);
  const actions = useGameStore((state) => state.actions);

  const isMyTurn = currentTurnPlayerId === myId;
  const activePlayer = players.find((p) => p.id === currentTurnPlayerId);

  // Resize canvas to match CSS layout
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }, []);

  // Timer logic for active player
  useEffect(() => {
    if (isMyTurn) {
      setInkUsed(0);
      setTimeLeft(TURN_TIME_MS);
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            clearInterval(interval);
            actions.endTurn();
            return 0;
          }
          return prev - 100;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isMyTurn, actions]);

  // Redraw all strokes whenever they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;

    let currentPathStart: null | { x: number; y: number } = null;

    canvasStrokes.forEach((stroke) => {
      if (stroke.isNewStroke || !currentPathStart) {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.moveTo(stroke.x, stroke.y);
        ctx.lineTo(stroke.x, stroke.y);
        ctx.stroke();
        currentPathStart = { x: stroke.x, y: stroke.y };
      } else {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.moveTo(currentPathStart.x, currentPathStart.y);
        ctx.lineTo(stroke.x, stroke.y);
        ctx.stroke();
        currentPathStart = { x: stroke.x, y: stroke.y };
      }
    });
  }, [canvasStrokes]);

  const getCoordinates = (
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    // Scale the coordinates based on actual dimension vs CSS dimension
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMyTurn || inkUsed >= MAX_INK) return;
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    lastPoint.current = { x, y };

    actions.drawStroke({ x, y, color, isNewStroke: true });
  };

  const draw = useCallback(
    (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !isMyTurn || !lastPoint.current) return;
      e.preventDefault();

      const { x, y } = getCoordinates(e);

      // Calculate distance for ink
      const distance = Math.sqrt(
        Math.pow(x - lastPoint.current.x, 2) +
          Math.pow(y - lastPoint.current.y, 2),
      );

      if (inkUsed + distance > MAX_INK) {
        setIsDrawing(false);
        lastPoint.current = null;
        return;
      }

      setInkUsed((prev) => prev + distance);
      lastPoint.current = { x, y };

      actions.drawStroke({ x, y, color, isNewStroke: false });
    },
    [isDrawing, isMyTurn, inkUsed, color, actions],
  );

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  // Attach global listeners for draw to prevent "sticking" if mouse leaves canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => stopDrawing();
    const handleGlobalMouseMove = (e: MouseEvent) => isDrawing && draw(e);
    const handleGlobalTouchMove = (e: TouchEvent) => isDrawing && draw(e);

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("touchend", handleGlobalMouseUp);

    // Only attach move to document if we are drawing, to capture outside movements
    if (isDrawing) {
      document.addEventListener("mousemove", handleGlobalMouseMove, {
        passive: false,
      });
      document.addEventListener("touchmove", handleGlobalTouchMove, {
        passive: false,
      });
    }

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchend", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("touchmove", handleGlobalTouchMove);
    };
  }, [isDrawing, draw]);

  const inkPercentage = Math.min((inkUsed / MAX_INK) * 100, 100);
  const OutOfInk = inkPercentage >= 100;

  const colors = [
    "#1a1a1a",
    "#991b1b",
    "#92400e",
    "#166534",
    "#1e40af",
    "#6b21a8",
    "#9d174d",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-stone-900 p-2 md:p-6 pb-24">
      <div className="w-full max-w-4xl space-y-4">
        {/* Header Banner */}
        <div className="flex items-center justify-between bg-stone-800 p-4 rounded-2xl border border-stone-700 shadow-xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl uppercase text-white shadow-lg ${isMyTurn ? "bg-emerald-500 shadow-emerald-500/30" : "bg-stone-600"}`}
            >
              {activePlayer?.name.charAt(0) || "?"}
            </div>
            <div>
              <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">
                {isMyTurn ? "Your turn!" : "Now Drawing"}
              </p>
              <h2 className="text-xl font-bold text-white">
                {activePlayer?.name || "Someone"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs text-stone-400 font-semibold uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </p>
              <div className="text-2xl font-black text-white px-3 py-1 bg-stone-900 rounded-lg">
                {(timeLeft / 1000).toFixed(1)}s
              </div>
            </div>

            {isMyTurn && (
              <button
                onClick={() => actions.endTurn()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <CheckSquare className="w-5 h-5" />
                <span>Done</span>
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative group">
          <div
            ref={containerRef}
            className="w-full aspect-[4/3] sm:aspect-video bg-[#E9DEB9] rounded-3xl border-2 border-[#d4c59a] overflow-hidden shadow-2xl relative"
          >
            <canvas
              ref={canvasRef}
              className={`w-full h-full touch-none ${isMyTurn && !OutOfInk ? "cursor-crosshair" : "cursor-not-allowed"}`}
              onMouseDown={startDrawing}
              onTouchStart={startDrawing}
            />

            {!isMyTurn && (
              <div className="absolute inset-0 z-10 pointer-events-none rounded-3xl ring-4 ring-inset ring-black/10" />
            )}
          </div>

          {/* Mobile Time indicator (floats over canvas on small screens) */}
          <div className="absolute top-4 right-4 sm:hidden bg-stone-900/80 backdrop-blur-md rounded-xl p-2 border border-stone-700 shadow-xl pointer-events-none flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xl font-black text-white">
              {(timeLeft / 1000).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Toolbar (Only for active player) */}
        {isMyTurn && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-stone-800/95 backdrop-blur-xl p-4 rounded-3xl border border-stone-700 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-10 z-50">
            {/* Color Palette */}
            <div className="flex justify-between items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full transition-transform border-[3px] ${color === c ? "scale-110 shadow-lg" : "scale-90 opacity-80 hover:opacity-100"} cursor-pointer active:scale-95`}
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "white" : "transparent",
                  }}
                />
              ))}
              <div className="w-px h-8 bg-stone-700 mx-1" />
              <button
                onClick={() => actions.clearCanvas()}
                className="w-10 h-10 rounded-xl bg-stone-700 flex items-center justify-center text-stone-300 hover:bg-stone-600 transition-colors active:scale-95"
                title="Clear Canvas"
              >
                <Eraser className="w-5 h-5" />
              </button>
            </div>

            {/* Ink Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
                <span className={OutOfInk ? "text-red-400" : "text-stone-400"}>
                  Ink Supply
                </span>
                <span
                  className={
                    OutOfInk ? "text-red-400 animate-pulse" : "text-emerald-400"
                  }
                >
                  {OutOfInk
                    ? "OUT OF INK!"
                    : `${Math.floor(100 - inkPercentage)}%`}
                </span>
              </div>
              <div className="h-4 bg-stone-900 rounded-full overflow-hidden border border-stone-700 shadow-inner">
                <div
                  className={`h-full transition-all duration-100 ease-out ${OutOfInk ? "bg-red-500" : "bg-gradient-to-r from-emerald-400 to-teal-400"}`}
                  style={{ width: `${inkPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
