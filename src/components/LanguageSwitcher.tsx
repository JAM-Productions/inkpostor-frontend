import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "en", label: "English" },
    { code: "ca", label: "Català" },
    { code: "es", label: "Español" },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs sm:text-sm bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-full border border-stone-700 text-white transition-all cursor-pointer shadow-lg active:scale-95"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink-primary" />
        <span className="font-medium">{currentLanguage.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-40 bg-stone-800 border border-stone-700 rounded-xl shadow-2xl overflow-hidden z-[100] animate-fade-in-up"
          role="listbox"
        >
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-between ${
                  i18n.language === lang.code
                    ? "bg-ink-primary/20 text-white font-bold"
                    : "text-stone-300 hover:bg-stone-700 hover:text-white"
                }`}
                role="option"
                aria-selected={i18n.language === lang.code}
              >
                <span>{lang.label}</span>
                {i18n.language === lang.code && (
                  <div className="w-1.5 h-1.5 rounded-full bg-ink-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
