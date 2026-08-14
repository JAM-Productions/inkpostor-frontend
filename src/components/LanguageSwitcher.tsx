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
        type="button"
        data-testid="language-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm sm:text-base font-handwritten font-bold bg-ink-surface hover:bg-stone-800 px-3.5 py-1.5 rounded-[14px_4px_16px_5px] border-2 border-stone-950 text-white transition-colors cursor-pointer shadow-[3px_3px_0px_#0c0b09] hover:-rotate-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0c0b09]"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="size-4 text-red-400" />
        <span className="font-bold tracking-wide">{currentLanguage.label}</span>
        <ChevronDown
          className={`size-4 text-amber-300 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-44 bg-ink-surface border-3 border-stone-950 rounded-[18px_6px_20px_6px] shadow-[5px_5px_0px_#0c0b09] overflow-hidden z-100 animate-fade-in-up"
          role="listbox"
        >
          <div className="py-1">
            {languages.map((lang) => (
              <button
                type="button"
                key={lang.code}
                data-testid={`lang-option-${lang.code}`}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-2.5 font-handwritten text-base font-bold transition-colors cursor-pointer flex items-center justify-between ${
                  i18n.language === lang.code
                    ? "bg-amber-100/20 text-amber-200 font-extrabold"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
                role="option"
                aria-selected={i18n.language === lang.code}
              >
                <span>{lang.label}</span>
                {i18n.language === lang.code && (
                  <div className="size-2 rounded-full bg-amber-400 border border-stone-950" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
