import "../../global.css";

import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { useFonts } from "expo-font";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUniwind } from "uniwind";

import { migrateLocalDatabase } from "@/data/database/migrations";
import { LocalDataProvider } from "@/data/local-data-provider";
import { ProfileProvider } from "@/features/profile/profile-provider";
import {
    AppThemeController,
    useAppThemeColors,
} from "@/shared/theme/app-theme";

function SystemBars() {
  const { theme } = useUniwind();
  const { background } = useAppThemeColors();
  const isDark = theme === "dark";

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(background);
  }, [background]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NavigationBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <SQLiteProvider
          databaseName="budget-manager.db"
          onInit={migrateLocalDatabase}
        >
          <LocalDataProvider>
            <AppThemeController />
            <ProfileProvider>
              <SystemBars />
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </ProfileProvider>
          </LocalDataProvider>
        </SQLiteProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
