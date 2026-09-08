import { Text, View } from "react-native";

import { formatSignedCurrency } from "@/shared/lib/currency";
import {
  colorWithAlpha,
  useAppThemeColors,
} from "@/shared/theme/app-theme";
import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";

import type { Transaction, TransactionTone } from "../types";

const toneStyles: Record<
  TransactionTone,
  { backgroundColor: string; foregroundColor: string }
> = {
  emerald: { backgroundColor: "#173a2a", foregroundColor: "#78d6a3" },
  blue: { backgroundColor: "#1b2e45", foregroundColor: "#82b8ee" },
  amber: { backgroundColor: "#3b3020", foregroundColor: "#f2c66d" },
  rose: { backgroundColor: "#402523", foregroundColor: "#ef8175" },
};

type TransactionListProps = {
  transactions: Transaction[];
};

export function TransactionList({ transactions }: TransactionListProps) {
  const theme = useAppThemeColors();

  return (
    <View className="gap-1">
      {transactions.map((transaction, index) => {
        const directionIcon: FilledIconName =
          transaction.amount >= 0 ? "arrow-bottom-left" : "arrow-top-right";
        const tone =
          transaction.tone === "emerald"
            ? {
                backgroundColor: colorWithAlpha(theme.accent, 0.14),
                foregroundColor: theme.accent,
              }
            : toneStyles[transaction.tone];

        return (
          <View
            key={transaction.id}
            className={`flex-row items-center py-3 ${
              index < transactions.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <View
              className="size-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: tone.backgroundColor }}
            >
              <FilledIcon
                color={tone.foregroundColor}
                name={transaction.icon}
                size={21}
              />
            </View>

            <View className="ml-3 flex-1 gap-0.5">
              <Text className="font-manrope-semibold text-[14px] text-foreground">
                {transaction.merchant}
              </Text>
              <Text className="font-sans text-xs text-muted">
                {transaction.category} · {transaction.occurredAt}
              </Text>
            </View>

            <View className="ml-2 items-end gap-1">
              <Text
                className={`font-manrope-bold text-[14px] ${
                  transaction.amount >= 0 ? "text-accent" : "text-foreground"
                }`}
              >
                {formatSignedCurrency(transaction.amount)}
              </Text>
              <FilledIcon name={directionIcon} size={15} tone="muted" />
            </View>
          </View>
        );
      })}
    </View>
  );
}
