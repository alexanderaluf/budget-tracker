import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { categoryEntrance } from "./category-motion";
import type { Category } from "@/data/selectors/category-selectors";
import type { CategoryType } from "@/data/model/category-record";
import { colorForeground } from "@/shared/icons/colors";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { RecordIcon } from "@/shared/ui/record-icon";

export const TYPE_LABELS = ["Expense", "Income", "Transfer"] as const;
export const TYPE_COLORS = ["#ef666d", "#80c783", "#58b5f3"] as const;

export function CategoryHeader({
  title,
  children,
  disabled = false,
}: {
  title: string;
  children?: ReactNode;
  disabled?: boolean;
}) {
  const router = useRouter();
  return (
    <Animated.View
      entering={categoryEntrance()}
      className="flex-row items-center gap-2 px-3 py-2"
    >
      <Button
        isIconOnly
        isDisabled={disabled}
        variant="ghost"
        accessibilityLabel="Go back"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      >
        <FilledIcon name="arrow-left" color="#ededed" size={26} />
      </Button>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        className="flex-1 font-manrope-bold text-2xl text-foreground"
      >
        {title}
      </Text>
      {children}
    </Animated.View>
  );
}

export function CategoryTypeSelector({
  value,
  onChange,
}: {
  value: CategoryType;
  onChange: (value: CategoryType) => void;
}) {
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const frames = useRef<
    Partial<Record<CategoryType, { x: number; width: number }>>
  >({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = frames.current[value];
    if (!frame) return;
    x.value = withSpring(frame.x, {
      damping: 20,
      mass: 0.7,
      stiffness: 210,
      reduceMotion: ReduceMotion.System,
    });
    width.value = withSpring(frame.width, {
      damping: 22,
      mass: 0.7,
      stiffness: 230,
      reduceMotion: ReduceMotion.System,
    });
  }, [value, x, width]);
  function measure(type: CategoryType, event: LayoutChangeEvent) {
    const frame = event.nativeEvent.layout;
    frames.current[type] = frame;
    if (type === value) {
      x.value = frame.x;
      width.value = frame.width;
      setReady(true);
    }
  }
  const indicator = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ translateX: x.value }],
  }));
  return (
    <View
      accessibilityRole="tablist"
      className="rounded-full border border-[#303030] bg-[#171717] p-1"
    >
      <View style={{ flexDirection: "row", position: "relative" }}>
        {ready && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                borderRadius: 999,
                backgroundColor: "#70d2eb",
              },
              indicator,
            ]}
          />
        )}
        {TYPE_LABELS.map((label, index) => (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: value === index }}
            onPress={() => onChange(index as CategoryType)}
            onLayout={(event) => measure(index as CategoryType, event)}
            className="min-h-12 flex-1 items-center justify-center rounded-full px-2"
          >
            <Text
              className="font-manrope-bold text-base"
              style={{ color: value === index ? "#073442" : "#ededed" }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function CategoryBadge({
  category,
  small = false,
}: {
  category: Category;
  small?: boolean;
}) {
  return (
    <View
      style={{
        width: small ? 30 : 56,
        height: small ? 30 : 56,
        borderRadius: small ? 9 : 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: category.color,
      }}
    >
      <RecordIcon
        name={category.icon}
        pathData={category.iconPath}
        color={colorForeground(category.color)}
        size={small ? 18 : 29}
      />
    </View>
  );
}

export function CategoryChip({
  category,
  selected,
  onPress,
  onLongPress,
}: {
  category?: Category;
  selected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={450}
      accessibilityHint={
        onLongPress ? "Press and hold to delete this subcategory" : undefined
      }
      accessibilityActions={
        onLongPress
          ? [{ name: "delete", label: "Delete subcategory" }]
          : undefined
      }
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "delete") onLongPress?.();
      }}
      className="min-h-11 flex-row items-center gap-2 rounded-full border px-3 py-2"
      style={{
        borderColor: selected ? "#70d2eb" : "#202020",
        backgroundColor: selected ? "#17343c" : "#171717",
      }}
    >
      {category ? (
        <RecordIcon
          name={category.icon}
          pathData={category.iconPath}
          color={category.color}
          size={20}
        />
      ) : (
        <FilledIcon name="filter" color="#70d2eb" size={20} />
      )}
      <Text
        className="font-manrope-medium text-sm"
        style={{ color: selected ? "#70d2eb" : "#ededed" }}
      >
        {category?.name ?? "All"}
      </Text>
    </Pressable>
  );
}
