import Animated from "react-native-reanimated";
import { BlurTargetView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  categoryEntrance,
  categoryLayout,
  categoryExit,
} from "./components/category-motion";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalData } from "@/data/local-data-provider";
import type { CategoryType } from "@/data/model/category-record";
import {
  selectCategories,
  selectCategoryMonthlyTotals,
} from "@/data/selectors/document-selectors";
import { useProfiles } from "@/features/profile/profile-provider";
import { formatCurrency } from "@/shared/lib/currency";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { RecordIcon } from "@/shared/ui/record-icon";
import {
  colorWithAlpha,
  useAppThemeColors,
} from "@/shared/theme/app-theme";
import {
  CategoryBadge,
  CategoryHeader,
  CategoryTypeSelector,
  TYPE_COLORS,
  TYPE_LABELS,
} from "./components/category-ui";
import { useCategoryClock } from "./use-category-clock";

export function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppThemeColors();
  const blurTargetRef = useRef<View | null>(null);
  const { document } = useLocalData();
  const { activeProfile } = useProfiles();
  const now = useCategoryClock();
  const [type, setType] = useState<CategoryType>(0);
  const [alphabetical, setAlphabetical] = useState(false);
  const categories = useMemo(() => selectCategories(document), [document]);
  const totals = useMemo(
    () => selectCategoryMonthlyTotals(document, now),
    [document, now],
  );
  const matching = categories.filter((category) => category.type === type);
  const roots = matching.filter((category) => {
    // Imported cycles remain reachable as cards, so they can be repaired.
    const visited = new Set([category.id]);
    let parent = matching.find((item) => item.id === category.parentId);
    if (!parent) return true;
    while (parent) {
      if (visited.has(parent.id)) return true;
      visited.add(parent.id);
      parent = matching.find((item) => item.id === parent!.parentId);
    }
    return false;
  });
  if (alphabetical) roots.sort((a, b) => a.name.localeCompare(b.name));
  const openCategory = (id: string) =>
    router.push({ pathname: "/categories/[id]", params: { id } });
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <CategoryHeader title="Categories">
        <Button
          isIconOnly
          variant="ghost"
          accessibilityLabel="About categories"
          onPress={() =>
            Alert.alert(
              "Categories",
              "Organize expense, income, and transfer transactions. Monthly totals include children. Open a category to view its history or manage its children.",
            )
          }
        >
          <FilledIcon name="help" size={25} />
        </Button>
        </CategoryHeader>
        <Animated.View
        entering={categoryEntrance(40)}
        className="flex-row items-center justify-between px-5 py-2"
      >
        <View>
          <Text className="font-manrope-bold text-lg text-accent">
            {matching.length}{" "}
            {matching.length === 1 ? "category" : "categories"}
          </Text>
          <Text className="font-sans text-sm text-muted">
            {now.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        <Button
          isIconOnly
          variant="ghost"
          accessibilityLabel={
            alphabetical
              ? "Use original category order"
              : "Sort categories alphabetically"
          }
          onPress={() => setAlphabetical((value) => !value)}
        >
          <FilledIcon
            name="filter"
            color={alphabetical ? theme.accent : theme.foreground}
            size={26}
          />
        </Button>
        </Animated.View>
        <FlatList
        data={roots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 8,
          paddingBottom: 110 + insets.bottom,
          flexGrow: 1,
        }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        renderItem={({ item, index }) => {
          const total = totals.get(item.id)!;
          const amounts = Object.entries(total.amounts);
          const children = matching.filter(
            (category) => category.parentId === item.id,
          );
          return (
            <Animated.View
              entering={categoryEntrance(70 + Math.min(index, 7) * 35)}
              exiting={categoryExit}
              layout={categoryLayout}
              className="rounded-[26px] border p-3"
              style={{ borderColor: `${item.color}35` }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.name}, ${total.count} transactions this month`}
                onPress={() => openCategory(item.id)}
                className="flex-row items-center gap-3"
              >
                <CategoryBadge category={item} />
                <View className="flex-1 gap-1">
                  <Text className="font-manrope-bold text-lg text-foreground">
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text
                      numberOfLines={2}
                      className="font-sans text-sm text-muted"
                    >
                      {item.description}
                    </Text>
                  ) : null}
                  <Text className="font-sans text-sm text-muted">
                    {total.count === 0
                      ? "No transactions"
                      : `${total.count} ${total.count === 1 ? "transaction" : "transactions"}`}
                  </Text>
                </View>
                <View style={{ maxWidth: "40%" }}>
                  {(amounts.length
                    ? amounts
                    : [[activeProfile.currencyCode, 0] as [string, number]]
                  ).map(([currency, amount]) => (
                    <Text
                      key={currency}
                      className="text-right font-manrope-bold text-sm"
                      style={{ color: TYPE_COLORS[type] }}
                    >
                      {formatCurrency(amount, currency)}
                    </Text>
                  ))}
                </View>
              </Pressable>
              {children.length > 0 && (
                <View className="ml-[68px] mt-3 flex-row flex-wrap gap-2">
                  {children.map((child) => (
                    <Pressable
                      key={child.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${child.name}`}
                      onPress={() => openCategory(child.id)}
                      className="min-h-9 flex-row items-center gap-1.5 rounded-lg px-2 py-1"
                      style={{ backgroundColor: `${child.color}18` }}
                    >
                      <RecordIcon
                        name={child.icon}
                        pathData={child.iconPath}
                        color={child.color}
                        size={17}
                      />
                      <Text
                        className="font-manrope-semibold text-xs"
                        style={{ color: child.color }}
                      >
                        {child.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <Animated.View
            entering={categoryEntrance(90)}
            className="flex-1 items-center justify-center gap-3 px-8"
          >
            <FilledIcon name="shopping" size={64} tone="muted" />
            <Text className="font-manrope-bold text-xl text-foreground">
              No {TYPE_LABELS[type].toLowerCase()} categories yet
            </Text>
            <Text className="text-center font-sans text-base text-muted">
              Create a category, then add children to organize your
              transactions.
            </Text>
          </Animated.View>
        }
        />
      </BlurTargetView>
      <LinearGradient
        colors={[
          colorWithAlpha(theme.background, 0),
          colorWithAlpha(theme.background, 0.78),
          theme.background,
        ]}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.54, 1]}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        style={[styles.bottomScrim, { height: 128 + insets.bottom }]}
      />
      <Animated.View
        entering={categoryEntrance(180)}
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: Math.max(insets.bottom, 10),
          zIndex: 20,
        }}
      >
        <CategoryTypeSelector
          blurTarget={blurTargetRef}
          value={type}
          onChange={setType}
        />
      </Animated.View>
      <Animated.View
        entering={categoryEntrance(180)}
        style={{
          position: "absolute",
          right: 20,
          bottom: Math.max(insets.bottom, 10) + 76,
          zIndex: 20,
        }}
      >
        <Button
          isIconOnly
          accessibilityLabel="Add category"
          className="size-16 rounded-full bg-accent"
          onPress={() =>
            router.push({
              pathname: "/categories/create",
              params: { type: String(type) },
            })
          }
        >
          <FilledIcon name="plus" size={32} tone="accent-foreground" />
        </Button>
      </Animated.View>
    </SafeAreaView>
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
});
