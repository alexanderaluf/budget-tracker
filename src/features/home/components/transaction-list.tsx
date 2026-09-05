import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { Text, View } from "react-native";

import { formatSignedCurrency } from "@/shared/lib/currency";

import type { Transaction, TransactionTone } from "../types";

const toneStyles: Record<
  TransactionTone,
  { backgroundColor: string; foregroundColor: string }
> = {
  emerald: { backgroundColor: "#17343c", foregroundColor: "#70d2eb" },
  blue: { backgroundColor: "#1b2e45", foregroundColor: "#82b8ee" },
  amber: { backgroundColor: "#3b3020", foregroundColor: "#f2c66d" },
  rose: { backgroundColor: "#402523", foregroundColor: "#ef8175" },
};

type TransactionListProps = {
  transactions: Transaction[];
};

export function TransactionList({ transactions }: TransactionListProps) {
  return (
    <View className="gap-1">
      {transactions.map((transaction, index) => {
        const Icon = transaction.icon;
        const DirectionIcon =
          transaction.amount >= 0 ? ArrowDownLeft : ArrowUpRight;
        const tone = toneStyles[transaction.tone];

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
              <Icon color={tone.foregroundColor} size={20} strokeWidth={2} />
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
                  transaction.amount >= 0 ? "text-[#70d2eb]" : "text-foreground"
                }`}
              >
                {formatSignedCurrency(transaction.amount)}
              </Text>
              <DirectionIcon color="#8e8e8e" size={13} strokeWidth={2} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
