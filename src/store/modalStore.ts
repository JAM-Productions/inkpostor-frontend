import { create } from "zustand";

export type ModalType = "RULES" | "END_GAME";

interface ModalState {
  activeModal: ModalType | null;
  actions: {
    openModal: (type: ModalType) => void;
    closeModal: () => void;
  };
}

export const useModalStore = create<ModalState>()((set) => ({
  activeModal: null,
  actions: {
    openModal: (type) => set({ activeModal: type }),
    closeModal: () => set({ activeModal: null }),
  },
}));
