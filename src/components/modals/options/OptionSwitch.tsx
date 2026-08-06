import React from "react";

type OptionSwitchTone = "amber" | "emerald" | "indigo" | "pink" | "purple";

const toneClasses: Record<OptionSwitchTone, string> = {
  amber: "border-amber-400/50 bg-amber-500",
  emerald: "border-emerald-400/50 bg-emerald-500",
  indigo: "border-indigo-400/50 bg-indigo-500",
  pink: "border-pink-400/50 bg-pink-500",
  purple: "border-purple-400/50 bg-purple-500",
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
    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors ${
      checked ? toneClasses[tone] : "border-stone-700 bg-stone-700"
    } ${disabled ? "cursor-default opacity-80" : "cursor-pointer"}`}
    aria-label={label}
  >
    <span
      className={`inline-block size-6 transform rounded-full bg-white shadow-sm transition-transform ${
        checked ? "translate-x-7" : "translate-x-1"
      }`}
    />
  </button>
);
