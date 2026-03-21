import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
      <Globe className="w-4 h-4 text-white/80" />
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent text-white outline-none cursor-pointer appearance-none pr-4"
        style={{ colorScheme: "dark" }}
      >
        <option value="en">English</option>
        <option value="ca">Català</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
}
