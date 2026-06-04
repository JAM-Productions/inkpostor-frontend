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

      window.addEventListener("keydown", handleEscape);
      return () => {
        window.removeEventListener("keydown", handleEscape);
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
        className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm w-full h-full cursor-default"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
        data-testid="close-modal-button-backdrop"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full h-full sm:h-auto sm:max-h-[calc(100vh-4rem)] sm:max-w-2xl bg-stone-900 sm:rounded-3xl border-0 sm:border border-stone-800 shadow-2xl flex flex-col overflow-hidden outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-ink-primary/10 rounded-lg">{icon}</div>
            <h2
              id={`${id}-title`}
              className="text-2xl font-extralight text-white font-rubik-wet-paint tracking-wide"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-white cursor-pointer"
            aria-label={closeLabel}
            data-testid="close-modal-button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-stone-800 bg-stone-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
