import "../../global.css";

import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { useFonts } from "expo-font";
import { NavigationBar } from "expo-navigation-bar";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  type Theme,
} from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUniwind } from "uniwind";

import { migrateLocalDatabase } from "@/data/database/migrations";
import { LocalDataProvider } from "@/data/local-data-provider";
import { ProfileProvider } from "@/features/profile/profile-provider";
import { LocalizationProvider } from "@/localization/localization-provider";
import {
    AppThemeController,
    useAppThemeColors,
} from "@/shared/theme/app-theme";

const ROOT_BACKGROUNDS = {
  dark: "#000000",
  light: "#DCE7E0",
} as const;

function AppNavigation() {
  const { theme } = useUniwind();
  const { accent, background, border, danger, foreground } =
    useAppThemeColors();
  const isDark = theme === "dark";
  const baseNavigationTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: accent,
      background,
      card: background,
      text: foreground,
      border,
      notification: danger,
    },
  };

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(background);
  }, [background]);

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={{ flex: 1, backgroundColor: background }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <NavigationBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: background },
          }}
        />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const { theme } = useUniwind();
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor:
          ROOT_BACKGROUNDS[theme === "dark" ? "dark" : "light"],
      }}
    >
      <HeroUINativeProvider>
        <SQLiteProvider
          databaseName="budget-manager.db"
          onInit={migrateLocalDatabase}
        >
          <LocalDataProvider>
            <LocalizationProvider>
              <AppThemeController />
              <ProfileProvider>
                <AppNavigation />
              </ProfileProvider>
            </LocalizationProvider>
          </LocalDataProvider>
        </SQLiteProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
