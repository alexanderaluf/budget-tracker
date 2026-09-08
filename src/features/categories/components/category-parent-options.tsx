import { useEffect, useState, type PropsWithChildren } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

export function CategoryParentOptions({
  open,
  children,
}: PropsWithChildren<{ open: boolean }>) {
  const [contentHeight, setContentHeight] = useState(0);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);
  useEffect(() => {
    const heightConfig = {
      duration: 240,
      easing: Easing.inOut(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    };
    if (open && contentHeight > 0) {
      height.value = withTiming(contentHeight, heightConfig);
      opacity.value = withDelay(
        140,
        withTiming(1, { ...heightConfig, duration: 120 }),
      );
      return;
    }
    opacity.value = withTiming(0, { ...heightConfig, duration: 100 });
    height.value = withTiming(0, heightConfig);
  }, [open, contentHeight, height, opacity]);
  const style = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));
  return (
    <Animated.View
      style={[{ overflow: "hidden" }, style]}
      pointerEvents={open ? "auto" : "none"}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
    >
      <View
        style={{ position: "absolute", left: 0, right: 0, paddingTop: 12 }}
        onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
      >
        {children}
      </View>
    </Animated.View>
  );
}
