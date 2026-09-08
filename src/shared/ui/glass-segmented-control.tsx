import { BlurView } from "expo-blur";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type SegmentValue = string | number;
type SegmentOption<Value extends SegmentValue> = {
  label: string;
  value: Value;
};

type GlassSegmentedControlProps<Value extends SegmentValue> = {
  accessibilityLabel?: string;
  blurTarget?: RefObject<View | null>;
  minHeight?: number;
  onChange: (value: Value) => void;
  options: readonly SegmentOption<Value>[];
  textSize?: number;
  value: Value;
};

export function GlassSegmentedControl<Value extends SegmentValue>({
  accessibilityLabel,
  blurTarget,
  minHeight = 48,
  onChange,
  options,
  textSize = 14,
  value,
}: GlassSegmentedControlProps<Value>) {
  const frames = useRef<Record<string, { width: number; x: number }>>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frame = frames.current[String(value)];
    if (!frame) return;
    indicatorX.value = withSpring(frame.x, {
      damping: 20,
      mass: 0.7,
      stiffness: 210,
      reduceMotion: ReduceMotion.System,
    });
    indicatorWidth.value = withSpring(frame.width, {
      damping: 22,
      mass: 0.7,
      stiffness: 230,
      reduceMotion: ReduceMotion.System,
    });
  }, [indicatorWidth, indicatorX, value]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
      style={styles.container}
    >
      {Platform.OS === "ios" || blurTarget ? (
        <BlurView
          blurMethod={
            Platform.OS === "android"
              ? "dimezisBlurViewSdk31Plus"
              : undefined
          }
          blurReductionFactor={3}
          blurTarget={blurTarget}
          intensity={36}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          tint="dark"
        />
      ) : null}
      <View style={styles.track}>
        {isReady ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicator, indicatorStyle]}
          />
        ) : null}
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              onLayout={({ nativeEvent: { layout } }) => {
                frames.current[String(option.value)] = layout;
                if (isSelected) {
                  indicatorX.value = layout.x;
                  indicatorWidth.value = layout.width;
                  setIsReady(true);
                }
              }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.tab,
                { minHeight },
                pressed && styles.pressed,
              ]}
            >
              <Text
                numberOfLines={1}
                className="font-manrope-bold"
                style={{
                  color: isSelected ? "#073442" : "#ededed",
                  fontSize: textSize,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(10, 10, 10, 0.62)",
    borderColor: "#303030",
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  track: {
    flexDirection: "row",
    margin: 4,
    position: "relative",
  },
  indicator: {
    backgroundColor: "#70d2eb",
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
  },
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
});