import { useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { FlatList, I18nManager, View } from "react-native";
import { useTranslation } from "react-i18next";
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
import { Text } from "@/shared/ui/app-text";
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
  const { t, i18n } = useTranslation();
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
          throw new Error(t("budgets.details.unavailableError"));
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
        reason instanceof Error
          ? reason.message
          : t("budgets.details.updateError"),
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  if (!budget)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <BudgetHeader title={t("budgets.details.title")} />
        <Text className="p-5 text-muted">
          {t("budgets.details.unavailableError")}
        </Text>
      </SafeAreaView>
    );
  const b = budget;
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <BudgetHeader title={t("budgets.details.title")} disabled={busy}>
        <Button
          isDisabled={busy}
          variant="ghost"
          isIconOnly
          accessibilityLabel={t("budgets.details.addTransaction")}
          onPress={() => setSheet("transaction")}
        >
          <FilledIcon name="plus" size={26} />
        </Button>
        <Button
          isDisabled={busy}
          variant="ghost"
          accessibilityLabel={t("budgets.details.deleteAccessibility")}
          onPress={() => setSheet("delete")}
        >
          <Text className="font-manrope-semibold text-danger">
            {t("budgets.details.delete")}
          </Text>
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
                title={t("budgets.details.showBudget")}
                description={t("budgets.details.showBudgetHelp")}
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
                {t("budgets.details.categoryBreakdown")}
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
                  {t("budgets.details.noCategoryActivity")}
                </Text>
              )}
            </BudgetPanel>
            <BudgetPanel>
              <Text className="font-manrope-semibold text-foreground">
                {b.range.start.toLocaleDateString(i18n.resolvedLanguage)} –{" "}
                {new Date(b.range.end.getTime() - 1).toLocaleDateString(
                  i18n.resolvedLanguage,
                )}
              </Text>
              <Text className="text-sm leading-6 text-muted">
                {t("budgets.details.matchingTransactions", {
                  count: b.transactions.length,
                  currency: b.currencyCode,
                })}
              </Text>
              {b.excludedCurrencyCount > 0 && (
                <Text className="text-sm text-muted">
                  {t("budgets.details.excludedCurrency", {
                    count: b.excludedCurrencyCount,
                  })}
                </Text>
              )}
              {b.notes.length > 0 && (
                <Text className="text-base leading-6 text-foreground">
                  {b.notes}
                </Text>
              )}
            </BudgetPanel>
            <Text className="px-2 pt-4 font-manrope-bold text-xl text-foreground">
              {t("budgets.details.transactions")}
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
                {new Date(t.timestamp).toLocaleDateString(
                  i18n.resolvedLanguage,
                )}
              </Text>
            </View>
            <Text className="font-manrope-semibold text-foreground">
              {formatCurrency(t.amount, b.currencyCode)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text className="px-3 py-6 text-muted">
            {t("budgets.details.noTransactions")}
          </Text>
        }
      />
      <View
        style={{
          position: "absolute",
          ...(I18nManager.isRTL ? { left: 20 } : { right: 20 }),
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
          <Button.Label>{t("budgets.details.edit")}</Button.Label>
        </Button>
      </View>
      {sheet === "transaction" && (
        <BudgetTransactionSheet budget={b} onClose={() => setSheet(null)} />
      )}
      {sheet === "delete" && (
        <BudgetSheet
          title={t("budgets.details.deleteTitle")}
          busy={busy}
          onClose={() => setSheet(null)}
        >
          <Text className="text-base leading-6 text-foreground">
            {t("budgets.details.deleteDescription", { name: b.name })}
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
            {busy
              ? t("budgets.details.deleting")
              : t("budgets.details.deleteBudget")}
          </Button>
        </BudgetSheet>
      )}
    </SafeAreaView>
  );
}
