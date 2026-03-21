import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en.json";
import caTranslation from "./locales/ca.json";
import esTranslation from "./locales/es.json";

const resources = {
  en: enTranslation,
  ca: caTranslation,
  es: esTranslation,
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // Default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already safe from xss
  },
});

export default i18n;
