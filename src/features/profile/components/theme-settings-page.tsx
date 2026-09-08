import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    ReduceMotion,
} from "react-native-reanimated";

import { useLocalData } from "@/data/local-data-provider";
import {
    THEME_MODES,
    type AccentColorId,
    type ThemeMode,
} from "@/data/model/backup-document";
import { colorForeground } from "@/shared/icons/colors";
import { ACCENT_OPTIONS } from "@/shared/theme/app-theme";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { GlassSegmentedControl } from "@/shared/ui/glass-segmented-control";

const MODE_LABELS: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const MODE_OPTIONS = THEME_MODES.map((mode) => ({
  label: MODE_LABELS[mode],
  value: mode,
}));

const reveal = FadeInDown.duration(400)
  .easing(Easing.bezier(0.22, 1, 0.36, 1))
  .reduceMotion(ReduceMotion.System);

export function ThemeSettingsPage() {
  const { document, updateDocument } = useLocalData();
  const { accentColor, themeMode } = document._local;
  const [error, setError] = useState("");

  async function setThemeMode(mode: ThemeMode) {
    if (mode === themeMode) return;
    setError("");
    try {
      await updateDocument((current) => ({
        ...current,
        _local: { ...current._local, themeMode: mode },
      }));
    } catch {
      setError("The appearance setting could not be saved.");
    }
  }

  async function setAccentColor(nextAccent: AccentColorId) {
    if (nextAccent === accentColor) return;
    setError("");
    try {
      await updateDocument((current) => ({
        ...current,
        _local: { ...current._local, accentColor: nextAccent },
      }));
    } catch {
      setError("The accent color could not be saved.");
    }
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-6 px-4 pt-3"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={reveal} className="gap-3">
        <View className="gap-1 px-1">
          <Text className="font-manrope-bold text-lg text-foreground">
            Appearance
          </Text>
          <Text className="font-sans text-sm leading-5 text-muted">
            System follows your device and updates when its appearance changes.
          </Text>
        </View>
        <GlassSegmentedControl
          accessibilityLabel="Application appearance"
          minHeight={52}
          onChange={(mode) => void setThemeMode(mode)}
          options={MODE_OPTIONS}
          value={themeMode}
        />
      </Animated.View>

      <Animated.View entering={reveal.delay(80)} className="gap-3">
        <View className="gap-1 px-1">
          <Text className="font-manrope-bold text-lg text-foreground">
            Accent color
          </Text>
          <Text className="font-sans text-sm leading-5 text-muted">
            Applied to actions, selected controls, links, and highlights.
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-3">
          {ACCENT_OPTIONS.map((option) => {
            const selected = option.id === accentColor;
            return (
              <Pressable
                key={option.id}
                accessibilityLabel={`${option.label} accent`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                className={`min-h-20 w-[48%] flex-row items-center gap-3 rounded-2xl border px-3 py-3 ${
                  selected
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface"
                }`}
                onPress={() => void setAccentColor(option.id)}
                style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
              >
                <View
                  className="size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: option.swatch }}
                >
                  {selected ? (
                    <FilledIcon
                      color={colorForeground(option.swatch)}
                      name="check"
                      size={22}
                    />
                  ) : null}
                </View>
                <Text
                  className="min-w-0 flex-1 font-manrope-semibold text-sm text-foreground"
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {error ? (
        <Text
          accessibilityRole="alert"
          className="font-sans text-sm text-danger"
        >
          {error}
        </Text>
      ) : null}
    </ScrollView>
  );
}
