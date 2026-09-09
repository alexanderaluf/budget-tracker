import { reloadAppAsync } from "expo";
import {
  createContext,
  type ComponentType,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { I18nextProvider } from "react-i18next";
import { I18nManager, Platform, View, type ViewProps } from "react-native";

import { useLocalData } from "@/data/local-data-provider";
import type { AppLanguage } from "@/data/model/backup-document";

import { i18n } from "./i18n";

type AppDirection = "ltr" | "rtl";

type LocalizationContextValue = {
  direction: AppDirection;
  isRTL: boolean;
  language: AppLanguage;
};

const nativeIsRTL = I18nManager.isRTL;
const LocalizationContext = createContext<LocalizationContextValue>({
  direction: nativeIsRTL ? "rtl" : "ltr",
  isRTL: nativeIsRTL,
  language: i18n.resolvedLanguage === "he" ? "he" : "en",
});
const DirectionalView = View as ComponentType<
  ViewProps & { dir?: AppDirection }
>;

export function LocalizationProvider({ children }: PropsWithChildren) {
  const { document } = useLocalData();
  const language = document._local.appLanguage;
  const isRTL = language === "he";
  const direction: AppDirection = isRTL ? "rtl" : "ltr";
  const [isLanguageReady, setIsLanguageReady] = useState(
    i18n.resolvedLanguage === language,
  );

  useEffect(() => {
    let active = true;

    async function applyLanguage() {
      if (i18n.resolvedLanguage !== language) {
        setIsLanguageReady(false);
        await i18n.changeLanguage(language);
      }
      if (active) setIsLanguageReady(true);

      if (Platform.OS !== "web" && I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.swapLeftAndRightInRTL(true);
        I18nManager.forceRTL(isRTL);
        await reloadAppAsync("Apply application language direction");
      }
    }

    void applyLanguage();
    return () => {
      active = false;
    };
  }, [isRTL, language]);

  if (!isLanguageReady) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <LocalizationContext.Provider value={{ direction, isRTL, language }}>
        <DirectionalView dir={direction} style={{ direction, flex: 1 }}>
          {children}
        </DirectionalView>
      </LocalizationContext.Provider>
    </I18nextProvider>
  );
}

export function useAppLocalization() {
  return useContext(LocalizationContext);
}