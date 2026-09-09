import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Pressable, Text, View } from "react-native";
import type { Budget } from "@/data/selectors/budget-selectors";
import {
  BudgetProgress,
  TYPE_LABELS,
} from "@/features/budgets/components/budget-ui";
import { formatCurrency } from "@/shared/lib/currency";

export function BudgetCard({ budgets }: { budgets: Budget[] }) {
  const router = useRouter();
  return (
    <View className="gap-4 rounded-3xl border border-border bg-surface p-5">
      <View className="flex-row items-center justify-between">
        <Text className="font-manrope-bold text-lg text-foreground">
          Your budgets
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.push("/budgets")}
        >
          See all
        </Button>
      </View>
      {budgets.map((b) => (
        <Pressable
          key={b.id}
          accessibilityRole="button"
          accessibilityLabel={`Open ${b.name} budget`}
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
                {TYPE_LABELS[b.transactionType]} · {b.period}
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
            Set a budget for the things that matter. Enable “Show budget” in its
            details to follow it here.
          </Text>
        </Pressable>
      )}
    </View>
  );
}
