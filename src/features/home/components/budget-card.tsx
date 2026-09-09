import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { Text } from "@/shared/ui/app-text";
import type { Budget } from "@/data/selectors/budget-selectors";
import {
  BudgetProgress,
  useBudgetLabels,
} from "@/features/budgets/components/budget-ui";
import { formatCurrency } from "@/shared/lib/currency";

export function BudgetCard({ budgets }: { budgets: Budget[] }) {
  const router = useRouter();
  const { t } = useTranslation();
  const labels = useBudgetLabels();
  return (
    <View className="gap-4 rounded-3xl border border-border bg-surface p-5">
      <View className="flex-row items-center justify-between">
        <Text className="font-manrope-bold text-lg text-foreground">
          {t("home.budgets.title")}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.push("/budgets")}
        >
          {t("home.budgets.seeAll")}
        </Button>
      </View>
      {budgets.map((b) => (
        <Pressable
          key={b.id}
          accessibilityRole="button"
          accessibilityLabel={t("home.budgets.open", { name: b.name })}
          onPress={() =>
            router.push({ pathname: "/budgets/[id]", params: { id: b.id } })
          }
          className="gap-2"
        >
          <View className="flex-row justify-between gap-3">
            <View className="flex-1">
              <Text className="font-manrope-semibold text-foreground">
                {b.name}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {labels.types[b.transactionType]} · {labels.periods[b.period]}
              </Text>
            </View>
            <Text className="text-xs text-muted">
              {formatCurrency(b.tracked, b.currencyCode)} /{" "}
              {formatCurrency(b.limit, b.currencyCode)}
            </Text>
          </View>
          <BudgetProgress percent={b.percent} color={b.color} />
        </Pressable>
      ))}
      {!budgets.length && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/budgets")}
        >
          <Text className="text-sm leading-6 text-muted">
            {t("home.budgets.empty")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
