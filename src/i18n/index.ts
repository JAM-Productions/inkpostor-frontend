import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en.json";
import caTranslation from "./locales/ca.json";
import esTranslation from "./locales/es.json";

export const resources = {
  en: enTranslation,
  ca: caTranslation,
  es: esTranslation,
};

export const LANGUAGE_KEY = "inkpostor_language";
export const SUPPORTED_LANGUAGES = Object.keys(resources);

export const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.error("Error reading language from localStorage:", e);
  }
  return "en";
};

// Create a new instance for easier testing without affecting global state
export const createI18nInstance = (lng?: string) => {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    resources,
    lng: lng || getInitialLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

  instance.on("languageChanged", (newLng) => {
    try {
      localStorage.setItem(LANGUAGE_KEY, newLng);
    } catch (e) {
      console.error("Error saving language to localStorage:", e);
    }
  });

  return instance;
};

// Default instance for the app
const defaultI18n = createI18nInstance();

export default defaultI18n;
