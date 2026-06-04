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
          onClick={onClose}
          className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
        >
          {t("rules.gotIt")}
        </button>
      }
    >
      {/* Objective */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-ink-primary">
          <Target className="size-5" />
          <h3 className="font-bold uppercase tracking-wider text-sm">
            {t("rules.objective.title")}
          </h3>
        </div>
        <p className="text-stone-300 leading-relaxed">
          {t("rules.objective.description")}
        </p>
      </section>

      {/* Setup */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-amber-500">
          <Settings className="size-5" />
          <h3 className="font-bold uppercase tracking-wider text-sm">
            {t("rules.setup.title")}
          </h3>
        </div>
        <ul className="space-y-2 text-stone-400 text-sm">
          <li className="flex gap-3">
            <span className="text-amber-500">•</span>
            {t("rules.setup.item1")}
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">•</span>
            {t("rules.setup.item2")}
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">•</span>
            {t("rules.setup.item3")}
          </li>
        </ul>
      </section>

      {/* Drawing Turns */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-blue-500">
          <PenTool className="size-5" />
          <h3 className="font-bold uppercase tracking-wider text-sm">
            {t("rules.drawing.title")}
          </h3>
        </div>
        <ul className="space-y-2 text-stone-400 text-sm">
          <li className="flex gap-3">
            <span className="text-blue-500">•</span>
            {t("rules.drawing.item1")}
          </li>
          <li className="flex gap-3">
            <span className="text-blue-500">•</span>
            {t("rules.drawing.item2")}
          </li>
          <li className="flex gap-3">
            <span className="text-blue-500">•</span>
            {t("rules.drawing.item3")}
          </li>
        </ul>
      </section>

      {/* Observe & Deduce */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-purple-500">
          <Search className="size-5" />
          <h3 className="font-bold uppercase tracking-wider text-sm">
            {t("rules.observe.title")}
          </h3>
        </div>
        <ul className="space-y-2 text-stone-400 text-sm">
          <li className="flex gap-3">
            <span className="text-purple-500">•</span>
            {t("rules.observe.item1")}
          </li>
          <li className="flex gap-3">
            <span className="text-purple-500">•</span>
            {t("rules.observe.item2")}
          </li>
        </ul>
      </section>

      {/* Voting Phase */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-orange-500">
          <Vote className="size-5" />
          <h3 className="font-bold uppercase tracking-wider text-sm">
            {t("rules.voting.title")}
          </h3>
        </div>
        <p className="text-stone-300 text-sm mb-2">
          {t("rules.voting.description")}
        </p>
        <ul className="space-y-2 text-stone-400 text-sm">
          <li className="flex gap-3">
            <span className="text-orange-500">•</span>
            {t("rules.voting.item1")}
          </li>
          <li className="flex gap-3">
            <span className="text-orange-500">•</span>
            {t("rules.voting.item2")}
          </li>
        </ul>
      </section>

      {/* End of the Game */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-green-500">
          <Trophy className="size-5" />
          <h3 className="font-bold uppercase tracking-wider text-sm">
            {t("rules.end.title")}
          </h3>
        </div>
        <ul className="space-y-2 text-stone-400 text-sm">
          <li className="flex gap-3">
            <span className="text-green-500">•</span>
            {t("rules.end.item1")}
          </li>
          <li className="flex gap-3">
            <span className="text-green-500">•</span>
            {t("rules.end.item2")}
          </li>
        </ul>
      </section>

      {/* Tip */}
      <div className="bg-stone-800/50 rounded-2xl p-4 border border-stone-700/50 flex gap-4 items-center">
        <div className="shrink-0 p-2 bg-yellow-500/10 rounded-lg h-fit">
          <Lightbulb className="size-5 text-yellow-500" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm mb-1">
            {t("rules.tip.title")}
          </h4>
          <p className="text-stone-400 text-sm italic">
            {t("rules.tip.description")}
          </p>
        </div>
      </div>
    </BaseModal>
  );
};
