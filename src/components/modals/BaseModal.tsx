import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  id: string;
  closeLabel: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  id,
  closeLabel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };

      // On phones the modal covers the whole screen, and the page behind it
      // kept scrolling underneath — so closing it could leave the player
      // somewhere else entirely.
      const { overflow } = document.body.style;
      document.body.style.overflow = "hidden";

      window.addEventListener("keydown", handleEscape);
      return () => {
        window.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = overflow;
        previousFocus.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 h-full w-full animate-fade-in bg-stone-950/80 backdrop-blur-sm animate-duration-fast motion-reduce:animate-none cursor-default"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
        data-testid="close-modal-button-backdrop"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-ink-surface shadow-[8px_8px_0px_#0c0b09] outline-none animate-fade-in-up animate-duration-fast animate-bezier-back-out motion-reduce:animate-none sm:h-auto sm:max-h-[calc(100vh-4rem)] sm:max-w-2xl sm:rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-0 border-stone-950 sm:border-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b-2 border-dashed border-stone-700 bg-[#181512]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-950/80 border-2 border-stone-950 rounded-[12px_4px_14px_4px] text-amber-300 shadow-[2px_2px_0px_#000]">
              {icon}
            </div>
            <h2
              id={`${id}-title`}
              className="text-2xl sm:text-3xl text-white font-rubik-wet-paint tracking-wide"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-full border-2 border-stone-950 bg-[#181512] transition-transform hover:-rotate-6 active:scale-95 text-stone-300 hover:text-white cursor-pointer shadow-[2px_2px_0px_#000]"
            aria-label={closeLabel}
            data-testid="close-modal-button"
          >
            <X className="size-6 text-amber-300" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar font-handwritten">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-5 sm:p-6 border-t-2 border-dashed border-stone-700 bg-[#181512]/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
