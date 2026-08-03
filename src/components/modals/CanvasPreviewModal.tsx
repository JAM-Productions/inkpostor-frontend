import React from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon } from "lucide-react";
import { BaseModal } from "./BaseModal";
import { CanvasPreview } from "../canvas/CanvasPreview";

interface CanvasPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CanvasPreviewModal: React.FC<CanvasPreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      id="canvas-preview"
      title={t("canvasPreview.title")}
      closeLabel={t("canvasPreview.closeDialog")}
      icon={<ImageIcon className="size-6 text-ink-primary" />}
    >
      {/* The modal is full-screen on mobile, so the portrait box only needs to
          leave room for the header */}
      <CanvasPreview
        showLabel={false}
        className="max-w-[60vh] mx-auto sm:max-w-none"
      />
    </BaseModal>
  );
};
