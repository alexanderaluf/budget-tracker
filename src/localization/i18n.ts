import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { he } from "./locales/he";

export const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    he: { translation: he },
  },
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "he"],
  interpolation: { escapeValue: false },
  returnNull: false,
});