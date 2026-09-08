import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    ReduceMotion,
} from "react-native-reanimated";

import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";

type SettingsItem = {
  description: string;
  icon: FilledIconName;
  iconBackground: string;
  title: string;
  badge?: string;
};

type ProfileSettingsPageProps = {
  onOpenTheme: () => void;
};

const primarySettings: SettingsItem[] = [
  {
    title: "Theme",
    description: "Appearance mode and application accent color",
    icon: "tune",
    iconBackground: "#f187ae",
  },
  {
    title: "Formats & Suggestions",
    description: "Customize transaction entry formats and autofill suggestions",
    icon: "format-paint",
    iconBackground: "#ffc975",
  },
  {
    title: "Data & Backup",
    description: "Local backups, cloud backup, imports, and history",
    icon: "backup",
    iconBackground: "#79bced",
  },
  {
    title: "Security & Reminders",
    description: "App lock, reminders, notifications, and vibration",
    icon: "notifications-active",
    iconBackground: "#9bd59b",
  },
  {
    title: "Money & Tools",
    description: "Budgets, goals, loans, rates, reports, and finance tools",
    icon: "wallet",
    iconBackground: "#ca79da",
  },
  {
    title: "Support & App",
    description: "Help, community, sharing, legal info, and app details",
    icon: "help",
    iconBackground: "#74c8c5",
  },
  {
    title: "Labs",
    description: "Experimental switches and platform-specific options",
    icon: "experiment",
    iconBackground: "#929ce3",
  },
];

const toolSettings: SettingsItem[] = [
  {
    title: "Exchange rates",
    description: "Manage currency conversion rates",
    icon: "currency-exchange",
    iconBackground: "#cbbab5",
  },
  {
    title: "Currency converter",
    description: "Quickly convert between currencies using your saved rates",
    icon: "swap-horizontal",
    iconBackground: "#65c8d9",
  },
  {
    title: "Receipt gallery",
    description: "Browse photos and receipts attached to your transactions",
    icon: "photo-library",
    iconBackground: "#dbe971",
  },
  {
    title: "Net worth",
    description: "Combine your accounts, assets and loans into one total",
    icon: "trending-up",
    iconBackground: "#ff9c87",
  },
  {
    title: "Achievements",
    description: "Track your milestones and rewards",
    icon: "trophy",
    iconBackground: "#a88ce0",
    badge: "Beta",
  },
];

function SettingsRow({
  item,
  onPress,
}: {
  item: SettingsItem;
  onPress?: () => void;
}) {
  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }
    Alert.alert(
      item.title,
      "This section is ready for its dedicated settings.",
    );
  }

  return (
    <Pressable
      accessibilityHint={item.description}
      accessibilityRole="button"
      className="min-h-[92px] flex-row items-center bg-surface px-4 py-4"
      onPress={handlePress}
      style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
    >
      <View
        className="size-[48px] items-center justify-center rounded-[14px]"
        style={{ backgroundColor: item.iconBackground }}
      >
        <FilledIcon color="#090909" name={item.icon} size={27} />
      </View>

      <View className="ml-4 flex-1 justify-center">
        <View className="flex-row items-center gap-2">
          <Text className="font-manrope-semibold text-[17px] leading-6 text-foreground">
            {item.title}
          </Text>
          {item.badge ? (
            <View className="rounded-full bg-accent/10 px-2 py-0.5">
              <Text className="font-manrope-semibold text-[11px] text-accent">
                {item.badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-0.5 font-sans text-sm leading-5 text-muted">
          {item.description}
        </Text>
      </View>
    </Pressable>
  );
}

function SettingsGroup({
  items,
  onOpenTheme,
}: {
  items: SettingsItem[];
  onOpenTheme?: () => void;
}) {
  return (
    <View className="gap-0.5 overflow-hidden rounded-[28px] bg-background">
      {items.map((item) => (
        <SettingsRow
          item={item}
          key={item.title}
          onPress={item.title === "Theme" ? onOpenTheme : undefined}
        />
      ))}
    </View>
  );
}

function createRevealAnimation(delay: number) {
  return FadeInDown.duration(420)
    .delay(delay)
    .easing(Easing.bezier(0.22, 1, 0.36, 1))
    .reduceMotion(ReduceMotion.System);
}

export function ProfileSettingsPage({ onOpenTheme }: ProfileSettingsPageProps) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4 px-4 pt-3"
      contentContainerStyle={{ paddingBottom: 28 }}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={createRevealAnimation(45)}>
        <SettingsGroup items={primarySettings} onOpenTheme={onOpenTheme} />
      </Animated.View>
      <Animated.View entering={createRevealAnimation(130)}>
        <SettingsGroup items={toolSettings} />
      </Animated.View>
    </ScrollView>
  );
}
