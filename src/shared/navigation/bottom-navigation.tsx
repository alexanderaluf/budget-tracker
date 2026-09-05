import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { CreditCardIcon, ListFilter, Plus, Search } from "lucide-react-native";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    type LayoutChangeEvent,
} from "react-native";
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { navigationItems } from "./navigation-config";
import type { TabId } from "./types";

type BottomNavigationProps = {
  activeItem: TabId;
  blurTarget: RefObject<View | null>;
  onChange: (item: TabId) => void;
  onActionPress: (item: TabId) => void;
};

type TabFrame = { width: number; x: number };

const actionIcons = {
  home: Plus,
  accounts: CreditCardIcon,
  reports: ListFilter,
  search: Search,
} satisfies Record<TabId, (typeof navigationItems)[number]["icon"]>;

export function BottomNavigation({
  activeItem,
  blurTarget,
  onChange,
  onActionPress,
}: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const actionOpacity = useSharedValue(1);
  const actionTranslateY = useSharedValue(0);
  const [isIndicatorReady, setIsIndicatorReady] = useState(false);
  const [displayedActionItem, setDisplayedActionItem] =
    useState<TabId>(activeItem);
  const tabFrames = useRef<Partial<Record<TabId, TabFrame>>>({});
  const targetActionItem = useRef(activeItem);
  const ActionIcon = actionIcons[displayedActionItem];

  useEffect(() => {
    const activeFrame = tabFrames.current[activeItem];
    if (!activeFrame) return;

    indicatorX.value = withSpring(activeFrame.x, {
      damping: 20,
      mass: 0.7,
      stiffness: 210,
    });
    indicatorWidth.value = withSpring(activeFrame.width, {
      damping: 22,
      mass: 0.7,
      stiffness: 230,
    });
  }, [activeItem, indicatorWidth, indicatorX]);

  useEffect(() => {
    if (activeItem === displayedActionItem) return;

    targetActionItem.current = activeItem;
    actionTranslateY.value = withTiming(12, {
      duration: 150,
      easing: Easing.in(Easing.cubic),
    });
    actionOpacity.value = withTiming(
      0,
      { duration: 120, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(showNextActionIcon)();
      },
    );
  }, [activeItem, actionOpacity, actionTranslateY, displayedActionItem]);

  function showNextActionIcon() {
    setDisplayedActionItem(targetActionItem.current);
    actionTranslateY.value = -12;

    requestAnimationFrame(() => {
      actionTranslateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      actionOpacity.value = withTiming(1, {
        duration: 190,
        easing: Easing.out(Easing.quad),
      });
    });
  }

  function handleTabLayout(item: TabId, event: LayoutChangeEvent) {
    const { width, x } = event.nativeEvent.layout;
    tabFrames.current[item] = { width, x };

    if (item === activeItem) {
      indicatorX.value = x;
      indicatorWidth.value = width;
      setIsIndicatorReady(true);
    }
  }

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  const actionIconStyle = useAnimatedStyle(() => ({
    opacity: actionOpacity.value,
    transform: [{ translateY: actionTranslateY.value }],
  }));

  return (
    <>
      <LinearGradient
        colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.72)", "#000000"]}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.58, 1]}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        style={[styles.bottomScrim, { height: 104 + insets.bottom }]}
      />

      <View style={[styles.dock, { bottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.navigationPill}>
          <BlurView
            blurMethod="dimezisBlurViewSdk31Plus"
            blurReductionFactor={3}
            blurTarget={blurTarget}
            intensity={36}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            tint="dark"
          />

          <View accessibilityRole="tablist" style={styles.tabsTrack}>
            {isIndicatorReady ? (
              <Animated.View
                pointerEvents="none"
                style={[styles.activeIndicator, indicatorStyle]}
              />
            ) : null}

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeItem;

              return (
                <Pressable
                  key={item.id}
                  accessibilityLabel={item.label}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  hitSlop={4}
                  onLayout={(event) => handleTabLayout(item.id, event)}
                  onPress={() => onChange(item.id)}
                  style={({ pressed }) => [
                    styles.tab,
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon
                    color={isActive ? "#70d2eb" : "#ededed"}
                    size={22}
                    strokeWidth={isActive ? 2.8 : 2.5}
                  />
                  <Text
                    className="font-manrope-bold"
                    numberOfLines={1}
                    style={[styles.label, isActive && styles.activeLabel]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          accessibilityLabel={
            activeItem === "home"
              ? "Add transaction"
              : activeItem === "accounts"
                ? "Add account"
                : activeItem === "reports"
                  ? "Filter reports"
                  : "Open search"
          }
          accessibilityRole="button"
          onPress={() => onActionPress(activeItem)}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          <Animated.View style={[styles.actionIcon, actionIconStyle]}>
            <ActionIcon color="#073442" size={25} strokeWidth={3} />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bottomScrim: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
  dock: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    left: 0,
    paddingHorizontal: 12,
    position: "absolute",
    right: 0,
    zIndex: 20,
  },
  navigationPill: {
    alignItems: "stretch",
    backgroundColor: "transparent",
    borderColor: "#303030",
    borderRadius: 30,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    height: 58,
    overflow: "hidden",
  },
  tabsTrack: {
    flex: 1,
    flexDirection: "row",
    margin: 3,
  },
  tab: {
    alignItems: "center",
    borderRadius: 26,
    flex: 1,
    gap: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  activeIndicator: {
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 26,
    left: 0,
    position: "absolute",
    top: 0,
  },
  label: {
    color: "#ededed",
    fontSize: 10.5,
    lineHeight: 14,
  },
  activeLabel: {
    color: "#70d2eb",
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#70d2eb",
    borderRadius: 29,
    height: 58,
    justifyContent: "center",
    overflow: "hidden",
    width: 58,
  },
  actionIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.72 },
});
