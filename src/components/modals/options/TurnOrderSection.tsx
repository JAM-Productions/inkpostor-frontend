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
      className="rounded-2xl border border-stone-800 bg-stone-800/40 p-4 sm:p-5"
      data-testid="turn-order-section"
    >
      <div className="flex gap-3">
        <div className="rounded-xl bg-teal-500/10 p-2 text-teal-400 h-fit">
          <ListOrdered className="size-5" />
        </div>
        <div className="w-full">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            {t("options.turnOrder.title")}
          </h3>
          <p className="mt-1 text-sm text-stone-400">
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
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer ${isSelected ? "border-ink-primary bg-ink-primary/10 text-white" : "border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-600 hover:text-white"}`}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-semibold">
                        {option.icon}
                        {option.label}
                      </span>
                      <span className="mt-1 block text-sm text-stone-400">
                        {option.hint}
                      </span>
                    </span>
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-ink-primary bg-ink-primary/20" : "border-stone-600"}`}
                    >
                      {isSelected && (
                        <Check className="size-3.5 text-ink-primary" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-white">
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold">
                  {selectedOption.icon}
                  {selectedOption.label}
                </span>
                <span className="mt-1 block text-sm text-stone-400">
                  {selectedOption.hint}
                </span>
              </span>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-ink-primary bg-ink-primary/20">
                <Check className="size-3.5 text-ink-primary" />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
