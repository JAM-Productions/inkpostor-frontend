import React, { lazy, Suspense, useEffect } from "react";
import { useModalStore, type ModalPayloads } from "../../store/modalStore";
import { useGameStore } from "../../store/gameState";

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

  // No fallback: the chunks are already warm, and flashing a spinner where a
  // modal is about to appear reads worse than the extra frame it saves.
  return <Suspense fallback={null}>{renderModal()}</Suspense>;
};
