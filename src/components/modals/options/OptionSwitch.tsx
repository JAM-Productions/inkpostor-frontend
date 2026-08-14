import React from "react";

type OptionSwitchTone =
  | "amber"
  | "emerald"
  | "indigo"
  | "pink"
  | "purple"
  | "red";

const toneClasses: Record<OptionSwitchTone, string> = {
  amber: "bg-amber-400 border-stone-950",
  emerald: "bg-emerald-400 border-stone-950",
  indigo: "bg-indigo-400 border-stone-950",
  pink: "bg-pink-400 border-stone-950",
  purple: "bg-purple-400 border-stone-950",
  red: "bg-ink-primary border-stone-950",
};

interface OptionSwitchProps {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: () => void;
  tone: OptionSwitchTone;
}

export const OptionSwitch: React.FC<OptionSwitchProps> = ({
  checked,
  disabled,
  label,
  onChange,
  tone,
}) => (
  <button
    type="button"
    role="switch"
    disabled={disabled}
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-8 w-15 shrink-0 items-center rounded-full border-3 border-stone-950 transition-colors shadow-[3px_3px_0px_#0c0b09] ${
      checked ? toneClasses[tone] : "bg-[#181512]"
    } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09]"}`}
    aria-label={label}
  >
    <span
      className={`inline-block size-6.5 transform rounded-full border-2 border-stone-950 transition-transform shadow-[1px_1px_0px_#000] ${
        checked ? "translate-x-7.5 bg-white" : "translate-x-0.5 bg-stone-400"
      }`}
    />
  </button>
);
