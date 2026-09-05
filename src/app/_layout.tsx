import "../../global.css";

import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { useFonts } from "expo-font";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Uniwind, useUniwind } from "uniwind";

Uniwind.setTheme("dark");

function SystemBars() {
  const { theme } = useUniwind();
  const isDark = theme === "dark";

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NavigationBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <SystemBars />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
