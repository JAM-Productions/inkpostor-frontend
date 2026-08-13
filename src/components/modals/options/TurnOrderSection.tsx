import React from "react";
import { Check, Flag, List, ListOrdered, Shuffle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TurnOrderMode } from "../../../store/gameState";

interface TurnOrderSectionProps {
  isHost: boolean;
  onChange: (turnOrderMode: TurnOrderMode) => void;
  turnOrderMode: TurnOrderMode;
}

export const TurnOrderSection: React.FC<TurnOrderSectionProps> = ({
  isHost,
  onChange,
  turnOrderMode,
}) => {
  const { t } = useTranslation();
  const options: {
    value: TurnOrderMode;
    label: string;
    hint: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "RANDOM_STARTER",
      label: t("options.turnOrder.randomStarter"),
      hint: t("options.turnOrder.randomStarterHint"),
      icon: <Flag className="size-4" />,
    },
    {
      value: "FIXED_ORDER",
      label: t("options.turnOrder.fixedOrder"),
      hint: t("options.turnOrder.fixedOrderHint"),
      icon: <List className="size-4" />,
    },
    {
      value: "RANDOM_ORDER",
      label: t("options.turnOrder.randomOrder"),
      hint: t("options.turnOrder.randomOrderHint"),
      icon: <Shuffle className="size-4" />,
    },
  ];
  const selectedOption =
    options.find((option) => option.value === turnOrderMode) ?? options[0];

  return (
    <section
      className="rounded-[18px_6px_20px_7px] border-2 border-stone-950 bg-[#181512] p-4 sm:p-5 shadow-[3px_3px_0px_#0c0b09]"
      data-testid="turn-order-section"
    >
      <div className="flex gap-3">
        <div className="rounded-[12px_4px_14px_4px] border-2 border-stone-950 bg-teal-950/80 p-2.5 text-teal-300 h-fit shadow-[2px_2px_0px_#000]">
          <ListOrdered className="size-5" />
        </div>
        <div className="w-full">
          <h3 className="text-base font-handwritten font-bold uppercase tracking-wider text-white">
            {t("options.turnOrder.title")}
          </h3>
          <p className="mt-0.5 text-base font-handwritten text-amber-200/70">
            {t("options.turnOrder.description")}
          </p>
          {isHost ? (
            <div
              className="mt-4 grid grid-cols-1 gap-3"
              role="radiogroup"
              aria-label={t("options.turnOrder.title")}
            >
              {options.map((option) => {
                const isSelected = option.value === selectedOption.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`flex items-center justify-between rounded-[14px_4px_16px_5px] border-2 px-4 py-3 text-left transition-all cursor-pointer font-handwritten ${
                      isSelected
                        ? "border-stone-950 bg-teal-400 text-stone-950 shadow-[3px_3px_0px_#000] -rotate-1"
                        : "border-stone-950 bg-[#26221d] text-teal-100 shadow-[2px_2px_0px_#000] hover:border-teal-400/60 hover:-rotate-1"
                    }`}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-lg font-extrabold">
                        {option.icon}
                        {option.label}
                      </span>
                      <span
                        className={`mt-0.5 block text-sm font-bold ${isSelected ? "text-stone-900" : "text-amber-200/70"}`}
                      >
                        {option.hint}
                      </span>
                    </span>
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-stone-950 ${
                        isSelected
                          ? "bg-stone-950 text-teal-400"
                          : "bg-[#181512] text-transparent"
                      }`}
                    >
                      {isSelected && (
                        <Check className="size-3.5 stroke-[3] text-teal-400" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between rounded-[14px_4px_16px_5px] border-2 border-stone-950 bg-[#26221d] px-4 py-3 text-white font-handwritten shadow-[2px_2px_0px_#000]">
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-lg font-bold text-teal-300">
                  {selectedOption.icon}
                  {selectedOption.label}
                </span>
                <span className="mt-0.5 block text-sm text-amber-200/70">
                  {selectedOption.hint}
                </span>
              </span>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-stone-950 bg-teal-400 text-stone-950">
                <Check className="size-3.5 stroke-[3] text-stone-950" />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
