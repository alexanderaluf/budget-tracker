import { Pressable, Text, View } from "react-native";

import { formatSignedCurrency } from "@/shared/lib/currency";
import { colorWithAlpha } from "@/shared/theme/app-theme";
import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";
import { RecordIcon } from "@/shared/ui/record-icon";

import type { Transaction } from "../types";

type TransactionListProps = {
  transactions: Transaction[];
  onPress: (transaction: Transaction) => void;
};

export function TransactionList({
  transactions,
  onPress,
}: TransactionListProps) {
  return (
    <View className="gap-1">
      {transactions.map((transaction, index) => {
        const directionIcon: FilledIconName =
          transaction.amount >= 0 ? "arrow-bottom-left" : "arrow-top-right";

        return (
          <Pressable
            key={transaction.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${transaction.merchant} transaction`}
            onPress={() => onPress(transaction)}
            className={`flex-row items-center py-3 ${
              index < transactions.length - 1 ? "border-b border-border" : ""
            }`}
            style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}
          >
            <View
              className="size-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: colorWithAlpha(transaction.color, 0.18),
              }}
            >
              <RecordIcon
                color={transaction.color}
                name={transaction.icon}
                pathData={transaction.iconPath}
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
                {formatSignedCurrency(
                  transaction.amount,
                  transaction.currencyCode,
                )}
              </Text>
              <FilledIcon name={directionIcon} size={15} tone="muted" />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
