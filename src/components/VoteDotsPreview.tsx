import React from "react";

interface VoteDotsPreviewProps {
  count: number;
  testId: string;
  isSelected: boolean;
}

export const VoteDotsPreview: React.FC<VoteDotsPreviewProps> = ({
  count,
  testId,
  isSelected,
}) => {
  if (!count) return null;
  return (
    <div className="ml-auto flex gap-1.5 pr-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          data-testid={testId}
          className={`size-2.5 sm:size-3 rounded-full ${
            isSelected ? "bg-white/80" : "bg-stone-500/70"
          } animate-pulse-fade-in`}
        />
      ))}
    </div>
  );
};
