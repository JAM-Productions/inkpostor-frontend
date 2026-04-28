import { create } from "zustand";

export type ModalPayloads = {
  RULES: undefined;
  END_GAME: undefined;
  KICK_PLAYER: { playerId: string };
};

export type ModalType = keyof ModalPayloads;

interface ModalState {
  activeModal: ModalType | null;
  modalData: unknown;
  actions: {
    openModal: <T extends ModalType>(
      type: T,
      ...data: ModalPayloads[T] extends undefined ? [] : [ModalPayloads[T]]
    ) => void;
    closeModal: () => void;
  };
}

export const useModalStore = create<ModalState>()((set) => ({
  activeModal: null,
  modalData: null,
  actions: {
    openModal: (type, ...data) =>
      set({ activeModal: type, modalData: data[0] }),
    closeModal: () => set({ activeModal: null, modalData: null }),
  },
}));
