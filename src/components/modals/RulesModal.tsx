import React from "react";
import { useTranslation } from "react-i18next";
import {
  HelpCircle,
  Target,
  Settings,
  PenTool,
  Search,
  Vote,
  Trophy,
  Lightbulb,
} from "lucide-react";
import { BaseModal } from "./BaseModal";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      id="rules"
      title={t("rules.title")}
      closeLabel={t("rules.closeDialog")}
      icon={<HelpCircle className="size-6 text-ink-primary" />}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-[#181512] hover:bg-stone-800 text-amber-200 font-handwritten text-xl font-bold rounded-[16px_5px_18px_6px] border-2 border-stone-950 shadow-[4px_4px_0px_#0c0b09] transition-colors hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09] cursor-pointer"
        >
          {t("rules.gotIt")}
        </button>
      }
    >
      {/* Objective */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-ink-primary">
          <Target className="size-5" />
          <h3 className="font-handwritten text-base font-bold uppercase tracking-wider sm:text-lg">
            {t("rules.objective.title")}
          </h3>
        </div>

        <p className="text-base leading-relaxed text-stone-300 sm:text-lg">
          {t("rules.objective.description")}
        </p>
      </section>

      {/* Setup */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-amber-500">
          <Settings className="size-5" />
          <h3 className="font-handwritten text-base font-bold uppercase tracking-wider sm:text-lg">
            {t("rules.setup.title")}
          </h3>
        </div>

        <ul className="space-y-2 text-base leading-relaxed text-stone-400 sm:text-lg">
          <li className="flex gap-3">
            <span className="text-amber-500 font-bold">✦</span>
            <span>{t("rules.setup.item1")}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500 font-bold">✦</span>
            <span>{t("rules.setup.item2")}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500 font-bold">✦</span>
            <span>{t("rules.setup.item3")}</span>
          </li>
        </ul>
      </section>

      {/* Drawing Turns */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-blue-500">
          <PenTool className="size-5" />
          <h3 className="font-handwritten text-base font-bold uppercase tracking-wider sm:text-lg">
            {t("rules.drawing.title")}
          </h3>
        </div>

        <ul className="space-y-2 text-base leading-relaxed text-stone-400 sm:text-lg">
          <li className="flex gap-3">
            <span className="text-blue-500 font-bold">✦</span>
            <span>{t("rules.drawing.item1")}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-500 font-bold">✦</span>
            <span>{t("rules.drawing.item2")}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-500 font-bold">✦</span>
            <span>{t("rules.drawing.item3")}</span>
          </li>
        </ul>
      </section>

      {/* Observe & Deduce */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-purple-500">
          <Search className="size-5" />
          <h3 className="font-handwritten text-base font-bold uppercase tracking-wider sm:text-lg">
            {t("rules.observe.title")}
          </h3>
        </div>

        <ul className="space-y-2 text-base leading-relaxed text-stone-400 sm:text-lg">
          <li className="flex gap-3">
            <span className="text-purple-500 font-bold">✦</span>
            <span>{t("rules.observe.item1")}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-500 font-bold">✦</span>
            <span>{t("rules.observe.item2")}</span>
          </li>
        </ul>
      </section>

      {/* Voting Phase */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-orange-500">
          <Vote className="size-5" />
          <h3 className="font-handwritten text-base font-bold uppercase tracking-wider sm:text-lg">
            {t("rules.voting.title")}
          </h3>
        </div>

        <p className="text-base leading-relaxed text-stone-300 sm:text-lg">
          {t("rules.voting.description")}
        </p>

        <ul className="space-y-2 text-base leading-relaxed text-stone-400 sm:text-lg">
          <li className="flex gap-3">
            <span className="text-orange-500 font-bold">✦</span>
            <span>{t("rules.voting.item1")}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-orange-500 font-bold">✦</span>
            <span>{t("rules.voting.item2")}</span>
          </li>
        </ul>
      </section>

      {/* End of the Game */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-green-500">
          <Trophy className="size-5" />
          <h3 className="font-handwritten text-base font-bold uppercase tracking-wider sm:text-lg">
            {t("rules.end.title")}
          </h3>
        </div>

        <ul className="space-y-2 text-base leading-relaxed text-stone-400 sm:text-lg">
          <li className="flex gap-3">
            <span className="text-green-500 font-bold">✦</span>
            <span>{t("rules.end.item1")}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-green-500 font-bold">✦</span>
            <span>{t("rules.end.item2")}</span>
          </li>
        </ul>
      </section>

      {/* Tip */}
      <div className="relative mt-1 px-4 py-3 bg-amber-100 text-stone-900 rounded-[14px_4px_16px_5px] border-2 border-stone-950 shadow-[3px_3px_0px_#0c0b09] rotate-[0.3deg]">
        {/* Tape */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-amber-200/70 border border-stone-400/40 rounded-sm -rotate-1 shadow-sm" />

        <div className="flex items-center gap-3">
          <div className="shrink-0 p-1.5 bg-amber-300 rounded-[8px_2px_7px_3px] border-2 border-stone-900">
            <Lightbulb className="size-4 text-stone-900" />
          </div>

          <div className="min-w-0">
            <h4 className="font-handwritten text-base font-bold leading-tight sm:text-lg">
              {t("rules.tip.title")}
            </h4>

            <p className="font-handwritten text-base leading-snug text-stone-700 sm:text-lg">
              {t("rules.tip.description")}
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
