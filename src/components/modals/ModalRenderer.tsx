import React, { lazy, Suspense, useEffect } from "react";
import { useModalStore, type ModalPayloads } from "../../store/modalStore";
import { useGameStore } from "../../store/gameState";
import { ModalErrorBoundary } from "./ModalErrorBoundary";

const loadRulesModal = () => import("./RulesModal");
const loadEndGameModal = () => import("./EndGameModal");
const loadOptionsModal = () => import("./OptionsModal");
const loadKickPlayerModal = () => import("./KickPlayerModal");
const loadExitGameModal = () => import("./ExitGameModal");

const RulesModal = lazy(() =>
  loadRulesModal().then((m) => ({ default: m.RulesModal })),
);
const EndGameModal = lazy(() =>
  loadEndGameModal().then((m) => ({ default: m.EndGameModal })),
);
const OptionsModal = lazy(() =>
  loadOptionsModal().then((m) => ({ default: m.OptionsModal })),
);
const KickPlayerModal = lazy(() =>
  loadKickPlayerModal().then((m) => ({ default: m.KickPlayerModal })),
);
const ExitGameModal = lazy(() =>
  loadExitGameModal().then((m) => ({ default: m.ExitGameModal })),
);

const prefetchModals = () => {
  void Promise.allSettled([
    loadRulesModal(),
    loadEndGameModal(),
    loadOptionsModal(),
    loadKickPlayerModal(),
    loadExitGameModal(),
  ]);
};

export const ModalRenderer: React.FC = () => {
  const activeModal = useModalStore((state) => state.activeModal);
  const modalData = useModalStore((state) => state.modalData);
  const closeModal = useModalStore((state) => state.actions.closeModal);
  const players = useGameStore((state) => state.players);
  const phase = useGameStore((state) => state.phase);
  const roomId = useGameStore((state) => state.roomId);

  useEffect(() => {
    if (roomId) prefetchModals();
  }, [roomId]);

  useEffect(() => {
    if (activeModal === "KICK_PLAYER") {
      const data = modalData as ModalPayloads["KICK_PLAYER"];
      const playerExists = players.some((p) => p.id === data?.playerId);
      if (!playerExists || phase !== "DRAWING") {
        closeModal();
      }
    } else if (activeModal === "OPTIONS" && phase !== "LOBBY") {
      closeModal();
    }
  }, [activeModal, modalData, players, phase, closeModal]);

  if (!activeModal) return null;

  const renderModal = () => {
    switch (activeModal) {
      case "RULES":
        return <RulesModal isOpen={true} onClose={closeModal} />;
      case "END_GAME":
        return <EndGameModal isOpen={true} onClose={closeModal} />;
      case "OPTIONS":
        if (phase !== "LOBBY") return null;
        return <OptionsModal isOpen={true} onClose={closeModal} />;
      case "KICK_PLAYER": {
        const data = modalData as ModalPayloads["KICK_PLAYER"];
        const playerToKick = players.find((p) => p.id === data?.playerId);

        if (!playerToKick) {
          return null;
        }

        return (
          <KickPlayerModal
            isOpen={true}
            onClose={closeModal}
            playerId={data.playerId}
          />
        );
      }
      case "EXIT_GAME":
        return <ExitGameModal isOpen={true} onClose={closeModal} />;
      default:
        return null;
    }
  };

  const fallback = (
    <div
      role="alert"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border-2 border-stone-800 bg-[#181512] p-6 text-center shadow-xl">
        <p className="text-sm font-medium text-stone-200 font-sans">
          Failed to load modal. Please check your connection.
        </p>
        <button
          type="button"
          onClick={closeModal}
          className="rounded-lg border border-stone-700 bg-stone-800 px-4 py-2 text-xs font-semibold text-stone-200 hover:bg-stone-700 active:scale-95 transition-all cursor-pointer font-sans"
        >
          Close
        </button>
      </div>
    </div>
  );

  // No fallback on Suspense: the chunks are already warm, and flashing a spinner
  // where a modal is about to appear reads worse than the extra frame it saves.
  // Wrapped in ErrorBoundary to isolate any chunk network failure to the modal itself.
  return (
    <ModalErrorBoundary resetKey={activeModal} fallback={fallback}>
      <Suspense fallback={null}>{renderModal()}</Suspense>
    </ModalErrorBoundary>
  );
};
