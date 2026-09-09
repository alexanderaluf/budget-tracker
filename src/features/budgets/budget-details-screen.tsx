import { useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { FlatList, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalData } from "@/data/local-data-provider";
import { belongsToProfile, identity } from "@/data/model/category-record";
import { selectBudgets } from "@/data/selectors/document-selectors";
import { useCategoryClock } from "@/features/categories/use-category-clock";
import { useAppThemeColors } from "@/shared/theme/app-theme";
import { formatCurrency } from "@/shared/lib/currency";
import { FilledIcon } from "@/shared/ui/filled-icon";
import {
  BudgetBadge,
  BudgetChart,
  BudgetHeader,
  BudgetPanel,
  BudgetProgress,
  BudgetSheet,
  BudgetSummary,
  BudgetToggle,
} from "./components/budget-ui";
import { BudgetTransactionSheet } from "./components/budget-transaction-sheet";

export function BudgetDetailsScreen({ id }: { id: string }) {
  const { document, updateDocument } = useLocalData(),
    now = useCategoryClock();
  const router = useRouter(),
    insets = useSafeAreaInsets(),
    c = useAppThemeColors();
  const budget = useMemo(
    () => selectBudgets(document, new Date()).find((b) => b.id === id),
    [document, now, id],
  );
  const [sheet, setSheet] = useState<"delete" | "transaction" | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const saving = useRef(false);
  async function mutate(action: "delete" | "home", value?: boolean) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await updateDocument((current) => {
        const record = current.budgets.find((b) => identity(b) === id);
        if (!record || !belongsToProfile(current, record))
          throw new Error("This budget is unavailable.");
        return {
          ...current,
          budgets:
            action === "delete"
              ? current.budgets.filter((b) => identity(b) !== id)
              : current.budgets.map((b) =>
                  identity(b) === id
                    ? {
                        ...b,
                        showOnHome: value === true,
                        updatedAt: new Date().toISOString(),
                      }
                    : b,
                ),
        };
      });
      if (action === "delete") {
        setSheet(null);
        router.replace("/budgets");
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to update budget.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  if (!budget)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <BudgetHeader title="Budget details" />
        <Text className="p-5 text-muted">This budget is unavailable.</Text>
      </SafeAreaView>
    );
  const b = budget;
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <BudgetHeader title="Budget details" disabled={busy}>
        <Button
          isDisabled={busy}
          variant="ghost"
          isIconOnly
          accessibilityLabel="Add budget transaction"
          onPress={() => setSheet("transaction")}
        >
          <FilledIcon name="plus" size={26} />
        </Button>
        <Button
          isDisabled={busy}
          variant="ghost"
          accessibilityLabel="Delete budget"
          onPress={() => setSheet("delete")}
        >
          <Text className="font-manrope-semibold text-danger">Delete</Text>
        </Button>
      </BudgetHeader>
      <FlatList
        data={b.transactions}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100 + insets.bottom,
          gap: 12,
        }}
        ListHeaderComponent={
          <View className="gap-3 pb-3 pt-3">
            <BudgetSummary budget={b} />
            <BudgetPanel>
              <BudgetToggle
                title="Show budget"
                description="Track this budget on the home screen"
                value={b.showOnHome}
                disabled={busy}
                onChange={(v) => mutate("home", v)}
              />
            </BudgetPanel>
            {!!error && (
              <Text accessibilityRole="alert" className="px-3 text-danger">
                {error}
              </Text>
            )}
            <BudgetChart budget={b} />
            <BudgetPanel>
              <Text
                className="font-manrope-semibold text-lg"
                style={{ color: b.color }}
              >
                Category breakdown
              </Text>
              {b.breakdown.map((cat) => (
                <View key={cat.id} className="flex-row items-center gap-3 py-2">
                  <BudgetBadge budget={cat} />
                  <View className="flex-1 gap-3">
                    <View className="flex-row justify-between gap-2">
                      <Text className="flex-1 font-manrope-medium text-foreground">
                        {cat.name}
                      </Text>
                      <Text className="text-sm text-muted">
                        {b.tracked
                          ? Math.round((cat.amount / b.tracked) * 100)
                          : 0}
                        %{" "}
                        <Text className="font-manrope-semibold text-foreground">
                          {formatCurrency(cat.amount, b.currencyCode)}
                        </Text>
                      </Text>
                    </View>
                    <BudgetProgress
                      percent={b.tracked ? (cat.amount / b.tracked) * 100 : 0}
                      color={cat.color}
                    />
                  </View>
                </View>
              ))}
              {!b.breakdown.length && (
                <Text className="text-muted">
                  No category activity in this period.
                </Text>
              )}
            </BudgetPanel>
            <BudgetPanel>
              <Text className="font-manrope-semibold text-foreground">
                {b.range.start.toLocaleDateString()} –{" "}
                {new Date(b.range.end.getTime() - 1).toLocaleDateString()}
              </Text>
              <Text className="text-sm leading-6 text-muted">
                {b.transactions.length} matching transactions · {b.currencyCode}
              </Text>
              {b.excludedCurrencyCount > 0 && (
                <Text className="text-sm text-muted">
                  {b.excludedCurrencyCount} matching transactions use another
                  currency and are excluded.
                </Text>
              )}
              {b.notes.length > 0 && (
                <Text className="text-base leading-6 text-foreground">
                  {b.notes}
                </Text>
              )}
            </BudgetPanel>
            <Text className="px-2 pt-4 font-manrope-bold text-xl text-foreground">
              Transactions
            </Text>
          </View>
        }
        renderItem={({ item: t }) => (
          <View className="flex-row items-center gap-3 rounded-2xl bg-surface p-4">
            <View className="flex-1">
              <Text className="font-manrope-semibold text-base text-foreground">
                {t.name}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {t.categoryName} · {t.accountName}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {new Date(t.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <Text className="font-manrope-semibold text-foreground">
              {formatCurrency(t.amount, b.currencyCode)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text className="px-3 py-6 text-muted">
            No matching transactions yet. Use + to add one.
          </Text>
        }
      />
      <View
        style={{
          position: "absolute",
          right: 20,
          bottom: Math.max(insets.bottom, 12),
        }}
      >
        <Button
          isDisabled={busy}
          className="h-14 rounded-2xl px-6"
          onPress={() =>
            router.push({ pathname: "/budgets/[id]/edit", params: { id } })
          }
        >
          <FilledIcon name="pencil" size={22} tone="accent-foreground" />
          <Button.Label>Edit</Button.Label>
        </Button>
      </View>
      {sheet === "transaction" && (
        <BudgetTransactionSheet budget={b} onClose={() => setSheet(null)} />
      )}
      {sheet === "delete" && (
        <BudgetSheet
          title="Delete budget?"
          busy={busy}
          onClose={() => setSheet(null)}
        >
          <Text className="text-base leading-6 text-foreground">
            Delete “{b.name}”? Your transactions and account balances will be
            kept.
          </Text>
          {!!error && (
            <Text accessibilityRole="alert" className="text-danger">
              {error}
            </Text>
          )}
          <Button
            variant="danger"
            isDisabled={busy}
            onPress={() => mutate("delete")}
          >
            {busy ? "Deleting…" : "Delete budget"}
          </Button>
        </BudgetSheet>
      )}
    </SafeAreaView>
  );
}
