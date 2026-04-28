import { create } from "zustand";

export type ModalType = "RULES" | "END_GAME" | "KICK_PLAYER";

interface ModalState {
  activeModal: ModalType | null;
  modalData?: any;
  actions: {
    openModal: (type: ModalType, data?: any) => void;
    closeModal: () => void;
  };
}

export const useModalStore = create<ModalState>()((set) => ({
  activeModal: null,
  modalData: null,
  actions: {
    openModal: (type, data) => set({ activeModal: type, modalData: data }),
    closeModal: () => set({ activeModal: null, modalData: null }),
  },
}));
