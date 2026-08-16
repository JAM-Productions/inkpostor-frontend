import React from "react";

/**
 * How the panel is dressed. A game that was played out is tinted by its winner;
 * a round result and a game that was simply closed stay neutral, because there
 * is no verdict to celebrate.
 */
export type ResultTone = "win" | "lose" | "neutral";

interface ResultPanelProps {
  tone: ResultTone;
  title: string;
  children: React.ReactNode;
}

const PANEL_TONES: Record<ResultTone, string> = {
  win: "border-emerald-600 bg-emerald-950/80 shadow-[0_0_50px_rgba(16,185,129,0.3)]",
  lose: "border-red-600 bg-red-950/80 shadow-[0_0_50px_rgba(220,38,38,0.3)]",
  neutral: "bg-ink-surface border-stone-950",
};

/** The taped panel every outcome is announced from. */
export const ResultPanel: React.FC<ResultPanelProps> = ({
  tone,
  title,
  children,
}) => (
  <div
    className={`relative p-6 sm:p-8 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-3 shadow-[6px_6px_0px_#0c0b09] transition-colors animate-fade-in animate-delay-200 animate-duration-slower ${PANEL_TONES[tone]}`}
  >
    {/* Taped top corner accent */}
    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 h-6 bg-amber-100/30 border border-stone-400/40 rounded-sm transform rotate-1 pointer-events-none shadow-sm z-20" />

    <h1 className="mb-6 text-3xl font-rubik-wet-paint uppercase tracking-wide text-white md:text-5xl">
      {title}
    </h1>

    {children}
  </div>
);
