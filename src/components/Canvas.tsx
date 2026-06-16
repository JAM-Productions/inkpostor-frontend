import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore, type Player } from "../store/gameState";
import {
  Undo,
  CheckSquare,
  Clock,
  Maximize2,
  Minimize2,
  Search,
  Users,
  LoaderCircle,
  PenLine,
} from "lucide-react";
import { VoteKickButton } from "./buttons/VoteKickButton";
import { ImpostorGuessForm } from "./ImpostorGuessForm";
import { MAX_INK, DOT_INK_COST } from "../lib/constants";
import {
  getActivePlayerCardColorClass,
  getPlayerIconColorClass,
} from "../lib/playerColors";
import { CANVAS_COLORS, DEFAULT_CANVAS_COLOR } from "../lib/canvasColors";
import { useClickOutside } from "../hooks/useClickOutside";
import { EmergencyAlertButton } from "./buttons/EmergencyAlertButton";

export const Canvas: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useGameStore((state) => state.isMobile);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCompressed, setIsCompressed] = useState(false);
  const [isSusListOpen, setIsSusListOpen] = useState(false);
  const [isGuessOpen, setIsGuessOpen] = useState(false);
  const [color, setColor] = useState(DEFAULT_CANVAS_COLOR);

  // Limits
  const [inkUsed, setInkUsed] = useState(0);
  const gameOptions = useGameStore((state) => state.gameOptions);
  const hasUnlimitedInk = gameOptions.unlimitedInk;
  const roundTimeMs = gameOptions.roundTime * 1000;
  const [timeLeft, setTimeLeft] = useState(roundTimeMs);

  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const inkCosts = useRef<number[]>([]);

  const canvasStrokes = useGameStore((state) => state.canvasStrokes);
  const currentTurnPlayerId = useGameStore(
    (state) => state.currentTurnPlayerId,
  );
  const myId = useGameStore((state) => state.myId);
  const hostId = useGameStore((state) => state.hostId);
  const players = useGameStore((state) => state.players);
  const actions = useGameStore((state) => state.actions);
  const amIImpostor = useGameStore((state) => state.amIImpostor);
  const impostorGuessesUsed = useGameStore(
    (state) => state.impostorGuessesUsed,
  );

  const attemptsLeft = gameOptions.impostorGuessAttempts - impostorGuessesUsed;
  const canGuess =
    !!amIImpostor && gameOptions.impostorGuessEnabled && attemptsLeft > 0;

  const suspectedPlayers = players.filter((p) => p.id !== myId);

  const isMyTurn = currentTurnPlayerId === myId;
  const activePlayer = players.find((p) => p.id === currentTurnPlayerId);

  const getRequiredVotes = (targetPlayer: Player) => {
    const activePlayers = players.filter((p) => p.isConnected);

    if (!targetPlayer.isConnected) {
      return activePlayers.length;
    }

    return Math.max(1, activePlayers.length - 1);
  };

  // Resize canvas to match CSS layout
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }, []);

  // Timer logic for all players
  useEffect(() => {
    if (currentTurnPlayerId) {
      if (isMyTurn) {
        setInkUsed(0);
        inkCosts.current = [];
      }
      setTimeLeft(roundTimeMs);
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            clearInterval(interval);
            if (isMyTurn) {
              actions.endTurn();
            }
            return 0;
          }
          return prev - 100;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentTurnPlayerId, isMyTurn, actions, roundTimeMs]);

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
    if (!isMyTurn || (!hasUnlimitedInk && inkUsed >= MAX_INK)) return;
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    lastPoint.current = { x, y };

    if (hasUnlimitedInk) {
      inkCosts.current.push(0);
    } else if (inkUsed + DOT_INK_COST >= MAX_INK) {
      const addedCost = MAX_INK - inkUsed;
      setInkUsed(MAX_INK);
      inkCosts.current.push(addedCost);
    } else {
      setInkUsed((prev) => prev + DOT_INK_COST);
      inkCosts.current.push(DOT_INK_COST);
    }

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

      if (!hasUnlimitedInk && inkUsed + distance > MAX_INK) {
        const allowedDistance = MAX_INK - inkUsed;
        inkCosts.current[inkCosts.current.length - 1] += allowedDistance;
        setInkUsed(MAX_INK);
        setIsDrawing(false);
        lastPoint.current = null;
        return;
      }

      if (!hasUnlimitedInk) {
        setInkUsed((prev) => prev + distance);
        inkCosts.current[inkCosts.current.length - 1] += distance;
      }
      lastPoint.current = { x, y };

      actions.drawStroke({ x, y, color, isNewStroke: false });
    },
    [isDrawing, isMyTurn, inkUsed, hasUnlimitedInk, color, actions],
  );

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const undoLastStroke = () => {
    if (inkCosts.current.length > 0) {
      const restoredInk = inkCosts.current.pop() || 0;
      setInkUsed((prev) => Math.max(0, prev - restoredInk));
      actions.undoStroke();
    }
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

  // Close dropdowns when clicking outside
  const suspectsRef = useRef<HTMLDivElement>(null);
  const guessRef = useRef<HTMLDivElement>(null);

  useClickOutside(suspectsRef, isSusListOpen, setIsSusListOpen);
  useClickOutside(guessRef, isGuessOpen, setIsGuessOpen);

  const inkPercentage = Math.min((inkUsed / MAX_INK) * 100, 100);
  const OutOfInk = !hasUnlimitedInk && inkPercentage >= 100;

  return (
    <div className="flex flex-col items-center bg-stone-900 p-2 md:p-6 pb-24 sm:justify-center mt-12">
      <div className="w-full max-w-4xl space-y-4">
        {/* Header Banner */}
        <div
          className={`relative flex items-center justify-between p-3 sm:p-4 rounded-2xl shadow-xl ${getActivePlayerCardColorClass(isMyTurn ? myId : null, hostId, players)}`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`size-12 rounded-full flex items-center justify-center font-bold text-xl uppercase text-white shadow-lg ${getPlayerIconColorClass(currentTurnPlayerId, hostId, players)} ${isMyTurn ? "animate-pulse" : ""}`}
              >
                {activePlayer?.isConnected !== false
                  ? activePlayer?.name.charAt(0) || "?"
                  : null}
              </div>
              {activePlayer?.isConnected === false && (
                <div className="absolute inset-0 size-12 rounded-full bg-black/50 flex items-center justify-center">
                  <LoaderCircle className="size-6 text-white animate-spin opacity-60" />
                </div>
              )}
            </div>
            {isMyTurn ? (
              <div className="animate-pulse">
                <p className="text-lg sm:text-2xl font-extrabold text-white uppercase tracking-wider">
                  {t("canvas.yourTurn")}
                </p>
              </div>
            ) : (
              <div>
                <p
                  className={`text-sm font-bold text-stone-400 uppercase tracking-widest ${activePlayer?.isConnected ? "" : "animate-pulse"}`}
                >
                  {activePlayer?.isConnected
                    ? t("canvas.nowDrawing")
                    : t("canvas.notConnected")}
                </p>
                <h2 className="text-lg font-semibold text-white">
                  {activePlayer?.name || t("canvas.someone")}
                </h2>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              {canGuess && !isMyTurn && (
                <div ref={guessRef}>
                  <button
                    type="button"
                    onClick={() => setIsGuessOpen(!isGuessOpen)}
                    className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-stone-900/50 cursor-pointer ${
                      isGuessOpen
                        ? "bg-stone-600 text-white border-2 border-stone-500"
                        : "bg-surface text-stone-300 hover:bg-stone-700 hover:text-white border-2 border-transparent"
                    }`}
                    aria-label={t("impostorGuess.guessWord")}
                  >
                    <PenLine className="size-5" />
                    <span className="hidden sm:inline">
                      {t("impostorGuess.guessWord")}
                    </span>
                  </button>

                  {isGuessOpen && (
                    <div className="absolute top-full inset-x-0 mt-3 p-4 bg-stone-800 rounded-2xl border border-stone-700 shadow-xl flex flex-col gap-2 z-50">
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-purple-300">
                        <PenLine className="size-4" />
                        {t("impostorGuess.title")}
                      </div>
                      <ImpostorGuessForm attemptsLeft={attemptsLeft} />
                    </div>
                  )}
                </div>
              )}
              {!isMyTurn && (
                <div className="relative" ref={suspectsRef}>
                  <button
                    type="button"
                    onClick={() => setIsSusListOpen(!isSusListOpen)}
                    className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-stone-900/50 cursor-pointer ${
                      isSusListOpen
                        ? "bg-stone-600 text-white border-2 border-stone-500"
                        : "bg-surface text-stone-300 hover:bg-stone-700 hover:text-white border-2 border-transparent"
                    }`}
                    aria-label={t("canvas.players")}
                  >
                    <Users className="size-5" />
                    <span className="hidden sm:inline">
                      {t("canvas.players")}
                    </span>
                  </button>

                  {isSusListOpen && (
                    <div className="absolute top-full right-0 mt-3 p-3 bg-stone-800 rounded-2xl border border-stone-700 shadow-2xl flex flex-col gap-2 min-w-[200px] sm:min-w-[240px] animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-200 z-50">
                      <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 px-1">
                        {t("canvas.suspects")}
                      </div>
                      {suspectedPlayers.map((player) => (
                        <div key={player.id} className="flex gap-1 w-full">
                          <button
                            type="button"
                            onClick={() => {
                              if (player.id !== myId && !player.isEjected)
                                actions.toggleSus(player.id);
                            }}
                            disabled={player.id === myId || player.isEjected}
                            title={player.name}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all flex-1 text-left ${
                              player.isEjected
                                ? "bg-stone-900/50 opacity-50 cursor-default"
                                : player.isSuspected
                                  ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 cursor-pointer"
                                  : "bg-stone-900/50 hover:bg-stone-700 text-stone-200 cursor-pointer"
                            }`}
                          >
                            <div
                              className={`size-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-sm ${player.id === currentTurnPlayerId ? "animate-pulse" : ""} ${getPlayerIconColorClass(
                                player.id,
                                hostId,
                                players,
                              )}`}
                            >
                              {player.name.charAt(0)}
                            </div>
                            <span className="font-semibold flex-1 truncate text-sm">
                              {player.name}
                            </span>
                            {player.id !== myId && !player.isEjected && (
                              <div
                                className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  player.isSuspected
                                    ? "border-red-500 bg-red-500/20 text-red-500"
                                    : "border-stone-600 text-transparent group-hover:border-stone-400"
                                }`}
                              >
                                {player.isSuspected && (
                                  <Search className="size-3" />
                                )}
                              </div>
                            )}
                          </button>
                          <VoteKickButton
                            player={player}
                            requiredVotes={getRequiredVotes(player)}
                            onAction={() => setIsSusListOpen(false)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Alert Dropdown */}
              {!isMyTurn && <EmergencyAlertButton />}
            </div>
            <div
              className={`flex flex-col items-end ${isMyTurn ? "hidden sm:flex" : "block sm:flex"}`}
            >
              <p className="text-xs text-stone-400 font-semibold uppercase mb-1 flex items-center gap-1">
                <Clock className="size-3" /> {t("canvas.time")}
              </p>
              <div className="text-2xl font-black text-white px-3 py-1 bg-stone-900 rounded-lg min-w-[80px] text-right tabular-nums">
                {(timeLeft / 1000).toFixed(1)}s
              </div>
            </div>

            {isMyTurn && (
              <button
                type="button"
                onClick={() => actions.endTurn()}
                className="bg-ink-secondary hover:bg-white text-black px-5 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-ink-secondary/20 cursor-pointer flex items-center gap-2"
              >
                <CheckSquare className="size-5" />
                <span>{t("canvas.done")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative group">
          <div
            ref={containerRef}
            className="w-full h-[70vh] sm:aspect-video sm:h-auto bg-[#E9DEB9] rounded-2xl overflow-hidden shadow-2xl relative"
          >
            <canvas
              ref={canvasRef}
              className={`w-full h-full touch-none ${
                isMyTurn && !OutOfInk
                  ? "cursor-crosshair"
                  : "cursor-not-allowed"
              }`}
              onMouseDown={startDrawing}
              onTouchStart={startDrawing}
            />

            {isMyTurn && OutOfInk && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-red-500 animate-zoom-in text-4xl md:text-6xl uppercase drop-shadow-lg font-rubik-wet-paint font-extralight">
                  {t("canvas.outOfInk")}
                </span>
              </div>
            )}
          </div>

          {/* Mobile Time indicator (floats over canvas on small screens) */}
          <div
            className={`absolute top-2.5 right-2.5 bg-stone-900/80 backdrop-blur-md rounded-xl p-2 border border-stone-700 shadow-xl pointer-events-none flex items-center gap-2 ${isMyTurn ? "sm:hidden" : "hidden"}`}
          >
            <Clock className="size-4 text-emerald-400" />
            <span className="text-xl font-black text-white tabular-nums text-right min-w-[44px]">
              {(timeLeft / 1000).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Toolbar (Only for active player) */}
        {isMyTurn && (
          <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] bg-stone-800/95 backdrop-blur-xl p-4 rounded-3xl border border-stone-700 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-10 z-50 transition-all duration-300 ${isCompressed ? "max-w-sm" : "max-w-3xl"}`}
          >
            {/* Color Palette & Controls */}
            {!isCompressed && (
              <div className="flex gap-3 w-full">
                <div
                  className={`flex flex-1 min-w-0 gap-1 p-0.5 ${isMobile ? "overflow-x-auto no-scrollbar" : "overflow-x-auto custom-scrollbar pb-3"}`}
                >
                  {CANVAS_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      aria-label={t(`canvas.colors.${c}`)}
                      className={`size-10 shrink-0 rounded-full transition-transform border-[3px] ${color === c ? "scale-105 shadow-lg" : "scale-90 opacity-80 hover:opacity-100"} cursor-pointer active:scale-95`}
                      style={{
                        backgroundColor: c,
                        borderColor: color === c ? "white" : "transparent",
                      }}
                    />
                  ))}
                </div>

                <div className="w-px h-8 shrink-0 bg-stone-700 mt-1.5" />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={undoLastStroke}
                    className="mt-0.5 size-10 rounded-xl shrink-0 cursor-pointer bg-stone-700 flex items-center justify-center text-stone-300 hover:bg-stone-600 transition-colors active:scale-95"
                    title={t("canvas.undo")}
                    aria-label="Undo last stroke"
                  >
                    <Undo className="size-5" />
                  </button>

                  {!hasUnlimitedInk && (
                    <button
                      type="button"
                      onClick={() => setIsCompressed(true)}
                      className="mt-0.5 size-10 rounded-xl shrink-0 cursor-pointer bg-stone-700 flex items-center justify-center text-stone-300 hover:bg-stone-600 transition-colors active:scale-95"
                      title={t("canvas.compress")}
                      aria-label="Compress toolbar"
                    >
                      <Minimize2 className="size-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Ink Meter & Compressed Mode Controls */}
            <div className="flex items-center gap-4">
              {!hasUnlimitedInk && (
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
                    <span
                      className={OutOfInk ? "text-red-400" : "text-stone-400"}
                    >
                      {t("canvas.inkSupply")}
                    </span>
                    <span
                      className={
                        OutOfInk
                          ? "text-red-400 animate-pulse"
                          : "text-emerald-400"
                      }
                    >
                      {OutOfInk
                        ? t("canvas.outOfInk")
                        : `${Math.floor(100 - inkPercentage)}%`}
                    </span>
                  </div>
                  <div className="h-4 bg-stone-900 rounded-full overflow-hidden border border-stone-700 shadow-inner">
                    <div
                      className={`h-full transition-all duration-100 ease-out ${OutOfInk ? "bg-red-500" : "bg-linear-to-r from-emerald-400 to-teal-400"}`}
                      style={{ width: `${inkPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {isCompressed && (
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={undoLastStroke}
                    className="size-10 rounded-xl cursor-pointer bg-stone-700 flex items-center justify-center text-stone-300 hover:bg-stone-600 transition-colors active:scale-95"
                    title={t("canvas.undo")}
                    aria-label="Undo last stroke"
                  >
                    <Undo className="size-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCompressed(false)}
                    className="size-10 rounded-xl cursor-pointer bg-stone-700 flex items-center justify-center text-stone-300 hover:bg-stone-600 transition-colors active:scale-95"
                    title={t("canvas.expand")}
                    aria-label="Expand toolbar"
                  >
                    <Maximize2 className="size-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
