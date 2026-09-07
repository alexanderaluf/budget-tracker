import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import type { AccountPeriod } from "../types";

const periods: AccountPeriod[] = ["Daily", "Weekly", "Monthly", "Yearly"];

export function AccountPeriodSelector({ value, onChange }: { value: AccountPeriod; onChange: (value: AccountPeriod) => void }) {
  const frames = useRef<Partial<Record<AccountPeriod, { x: number; width: number }>>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  useEffect(() => {
    const frame = frames.current[value];
    if (!frame) return;
    x.value = withSpring(frame.x, { damping: 20, mass: 0.7, stiffness: 210 });
    width.value = withSpring(frame.width, { damping: 22, mass: 0.7, stiffness: 230 });
  }, [value, x, width]);
  const indicator = useAnimatedStyle(() => ({ width: width.value, transform: [{ translateX: x.value }] }));
  return (
    <View style={styles.container}>
      <View accessibilityRole="tablist" style={styles.track}>
        <Animated.View pointerEvents="none" style={[styles.indicator, indicator]} />
        {periods.map((period) => (
          <Pressable key={period} accessibilityRole="tab" accessibilityState={{ selected: value === period }}
            onPress={() => onChange(period)} style={styles.tab}
            onLayout={({ nativeEvent: { layout } }) => {
              frames.current[period] = layout;
              if (value === period) { x.value = layout.x; width.value = layout.width; }
            }}>
            <Text className="font-manrope-bold text-sm" style={{ color: value === period ? "#073442" : "#ededed" }}>{period}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { borderWidth: 1, borderColor: "#343434", borderRadius: 999, overflow: "hidden", backgroundColor: "#0a0a0a" },
  track: { flexDirection: "row", margin: 4, position: "relative" },
  tab: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  indicator: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 999, overflow: "hidden", backgroundColor: "#70d2eb" },
});
