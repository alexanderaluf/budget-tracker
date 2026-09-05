import { BlurTargetView } from "expo-blur";
import { Slot, usePathname, useRouter } from "expo-router";
import { useRef } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "./bottom-navigation";
import { getTabFromPathname, navigationItems } from "./navigation-config";
import type { TabId } from "./types";

const actionLabels: Record<TabId, string> = {
  home: "Add transaction",
  accounts: "Add account",
  reports: "Filter reports",
  search: "Search transactions",
};

export function TabShell() {
  const blurTargetRef = useRef<View | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const activeItem = getTabFromPathname(pathname);

  function handleTabChange(tabId: TabId) {
    const destination = navigationItems.find((item) => item.id === tabId);

    if (destination && tabId !== activeItem) {
      router.replace(destination.href);
    }
  }

  function handleActionPress(tabId: TabId) {
    const action = actionLabels[tabId];
    Alert.alert(action, `${action} is ready for its dedicated flow.`);
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <View style={{ flex: 1 }}>
        <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
          <Slot />
        </BlurTargetView>

        <BottomNavigation
          activeItem={activeItem}
          blurTarget={blurTargetRef}
          onActionPress={handleActionPress}
          onChange={handleTabChange}
        />
      </View>
    </SafeAreaView>
  );
}
