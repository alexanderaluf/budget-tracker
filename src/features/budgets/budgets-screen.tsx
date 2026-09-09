import { useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { BlurTargetView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "heroui-native";
import { FlatList, Pressable, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalData } from "@/data/local-data-provider";
import { selectBudgets } from "@/data/selectors/document-selectors";
import { useCategoryClock } from "@/features/categories/use-category-clock";
import { useAppThemeColors } from "@/shared/theme/app-theme";
import { formatCurrency } from "@/shared/lib/currency";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { GlassSegmentedControl } from "@/shared/ui/glass-segmented-control";
import {
  BudgetHeader,
  BudgetOption,
  BudgetPanel,
  BudgetRing,
  BudgetSheet,
  BudgetSummary,
  TYPE_LABELS,
  trackedLabel,
} from "./components/budget-ui";

export function BudgetsScreen() {
  const { document } = useLocalData(),
    now = useCategoryClock();
  const router = useRouter(),
    insets = useSafeAreaInsets(),
    c = useAppThemeColors();
  const target = useRef<View | null>(null);
  const [type, setType] = useState(0),
    [compact, setCompact] = useState(false);
  const [sort, setSort] = useState("Newest"),
    [sheet, setSheet] = useState<"info" | "sort" | null>(null);
  const all = useMemo(() => selectBudgets(document, new Date()), [document, now]);
  const budgets = all
    .filter((b) => b.transactionType === type)
    .sort((a, b) =>
      sort === "Name"
        ? a.name.localeCompare(b.name)
        : sort === "Most used"
          ? b.percent - a.percent
          : String(b.record.createdAt).localeCompare(
              String(a.record.createdAt),
            ),
    );
  const totals = [...new Set(budgets.map((b) => b.currencyCode))].map(
    (currency) => {
      const group = budgets.filter((b) => b.currencyCode === currency);
      return {
        currency,
        limit: group.reduce((s, b) => s + b.limit, 0),
        tracked: group.reduce((s, b) => s + b.tracked, 0),
      };
    },
  );
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <BlurTargetView ref={target} style={{ flex: 1 }}>
        <BudgetHeader title="Budgets">
          <Button
            isIconOnly
            variant="ghost"
            accessibilityLabel="About budgets"
            onPress={() => setSheet("info")}
          >
            <FilledIcon name="help" size={25} />
          </Button>
        </BudgetHeader>
        <FlatList
          data={budgets}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 190 + insets.bottom,
            gap: 12,
          }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.name} budget`}
              onPress={() =>
                router.push({
                  pathname: "/budgets/[id]",
                  params: { id: item.id },
                })
              }
            >
              <BudgetSummary budget={item} compact={compact} />
            </Pressable>
          )}
          ListHeaderComponent={
            <View className="gap-5 pb-2 pt-4">
              {totals.map((t) => (
                <View key={t.currency} className="flex-row items-center gap-4">
                  <BudgetRing
                    percent={t.limit ? (t.tracked / t.limit) * 100 : 0}
                    color={c.accent}
                  />
                  <View className="flex-1 gap-2">
                    {[
                      ["Total", t.limit],
                      [trackedLabel(type), t.tracked],
                      ["Remaining", t.limit - t.tracked],
                    ].map(([label, value]) => (
                      <View
                        key={String(label)}
                        className="rounded-2xl border border-border bg-surface px-3 py-2"
                      >
                        <Text className="text-xs text-muted">{label}</Text>
                        <Text className="font-manrope-bold text-base text-foreground">
                          {Number(value) < 0 ? "−" : ""}
                          {formatCurrency(Number(value), t.currency)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
              <View className="flex-row items-center justify-between">
                <Text className="font-manrope-semibold text-lg text-accent">
                  {budgets.length} {budgets.length === 1 ? "budget" : "budgets"}
                </Text>
                <View className="flex-row gap-1">
                  <Button
                    isIconOnly
                    variant="secondary"
                    accessibilityLabel={
                      compact ? "Show expanded cards" : "Show compact cards"
                    }
                    onPress={() => setCompact((v) => !v)}
                  >
                    <FilledIcon name="tune" size={22} />
                  </Button>
                  <Button
                    isIconOnly
                    variant="secondary"
                    accessibilityLabel="Sort budgets"
                    onPress={() => setSheet("sort")}
                  >
                    <FilledIcon name="filter" size={22} />
                  </Button>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <BudgetPanel>
              <Text className="font-manrope-bold text-xl text-foreground">
                Make room for what matters
              </Text>
              <Text className="text-base leading-6 text-muted">
                Create your first {TYPE_LABELS[type].toLowerCase()} budget.
                Choose a category, set an amount, and your transactions will
                keep it up to date.
              </Text>
              <Button onPress={() => router.push("/budgets/create")}>
                Create budget
              </Button>
            </BudgetPanel>
          }
        />
      </BlurTargetView>
      <LinearGradient
        pointerEvents="none"
        colors={
          c.isDark
            ? ["rgba(0,0,0,0)", "rgba(0,0,0,.72)", "#000000"]
            : ["rgba(255,255,255,0)", "rgba(255,255,255,.8)", c.background]
        }
        locations={[0, 0.54, 1]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 138 + insets.bottom,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: Math.max(insets.bottom, 10),
        }}
      >
        <GlassSegmentedControl
          accessibilityLabel="Budget transaction type"
          blurTarget={target}
          value={type}
          onChange={setType}
          options={TYPE_LABELS.map((label, value) => ({ label, value }))}
        />
      </View>
      <View
        style={{
          position: "absolute",
          right: 20,
          bottom: Math.max(insets.bottom, 10) + 76,
        }}
      >
        <Button
          isIconOnly
          accessibilityLabel="Add budget"
          className="size-16 rounded-full"
          onPress={() => router.push("/budgets/create")}
        >
          <FilledIcon name="plus" size={30} tone="accent-foreground" />
        </Button>
      </View>
      {sheet && (
        <BudgetSheet
          title={sheet === "info" ? "How budgets work" : "Sort budgets"}
          onClose={() => setSheet(null)}
        >
          {sheet === "info" ? (
            <>
              <Text className="text-base leading-7 text-foreground">
                Each budget independently tracks matching transactions for its
                current period. You can create multiple budgets for any category
                or subcategory.
              </Text>
              <Text className="text-base leading-7 text-muted">
                Overview totals add budget amounts, so overlapping budgets may
                include the same transaction. Different currencies are shown
                separately. Future-dated transactions enter the totals when
                their date arrives.
              </Text>
              <Text className="text-base leading-7 text-muted">
                Weekly periods start on Monday. Automatic mode follows
                descendants as you add subcategories. Manual mode tracks your
                exact selections unless you enable subcategories.
              </Text>
            </>
          ) : (
            ["Newest", "Name", "Most used"].map((value) => (
              <BudgetOption
                key={value}
                title={value}
                selected={sort === value}
                onPress={() => {
                  setSort(value);
                  setSheet(null);
                }}
              />
            ))
          )}
        </BudgetSheet>
      )}
    </SafeAreaView>
  );
}
