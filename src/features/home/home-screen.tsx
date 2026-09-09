import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useLocalData } from "@/data/local-data-provider";
import {
  selectAccounts,
  selectBudgets,
  selectTransactions,
} from "@/data/selectors/document-selectors";
import { useProfiles } from "@/features/profile/profile-provider";
import { colorForeground } from "@/shared/icons/colors";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { TabPage } from "@/shared/ui/tab-page";

import { BudgetCard } from "./components/budget-card";
import { useCategoryClock } from "@/features/categories/use-category-clock";
import { PaymentCard } from "./components/payment-card";
import { TransactionList } from "./components/transaction-list";
import { primaryCard } from "./data/home-data";
import { TransactionDetailSheet } from "@/features/transactions/transaction-detail-sheet";

export function HomeScreen() {
  const router = useRouter();
  const { activeProfile } = useProfiles();
  const { document } = useLocalData();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const transactions = selectTransactions(document);
  const now = useCategoryClock();
  const accounts = selectAccounts(document);
  const persistedBudgets = selectBudgets(document).filter(b => b.showOnHome);
  const availableBalance = accounts
    .filter(
      (account) =>
        !account.isExcluded &&
        account.currencyCode === activeProfile.currencyCode.toUpperCase(),
    )
    .reduce((total, account) => total + account.balance, 0);

  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 3);
  const selectedTransaction = transactions.find(
    (transaction) => transaction.id === selectedTransactionId,
  );

  return (
    <>
      <TabPage>
      <View className="flex-row items-center justify-between pt-3">
        <View className="flex-1 pr-3">
          <Text className="font-manrope-medium text-xs uppercase tracking-widest text-muted">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text className="mt-1 font-manrope-bold text-2xl text-foreground">
            Good morning, {activeProfile.name.split(" ")[0]}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Open profile"
          accessibilityRole="button"
          hitSlop={6}
          onPress={() => router.push("/profile")}
          style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}
        >
          <View
            className="size-10 items-center justify-center rounded-full"
            style={{ backgroundColor: activeProfile.color }}
          >
            <FilledIcon
              color={colorForeground(activeProfile.color)}
              name="account"
              size={25}
            />
          </View>
        </Pressable>
      </View>

      <PaymentCard
        currencyCode={activeProfile.currencyCode}
        card={{
          ...primaryCard,
          balance: availableBalance,
          cardholder: activeProfile.name,
        }}
        isBalanceVisible={isBalanceVisible}
        onToggleBalance={() => setIsBalanceVisible((current) => !current)}
      />

      <BudgetCard
        budgets={persistedBudgets}
      />

      <View>
        <View className="mb-2 flex-row items-center justify-between">
          <View>
            <Text className="font-manrope-bold text-lg text-foreground">
              Recent activity
            </Text>
            <Text className="mt-0.5 font-sans text-xs text-muted">
              Your latest account movements
            </Text>
          </View>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => setShowAllTransactions((current) => !current)}
          >
            <Button.Label className="font-manrope-semibold text-accent">
              {showAllTransactions ? "Show less" : "See all"}
            </Button.Label>
            <FilledIcon name="chevron-right" size={18} tone="accent" />
          </Button>
        </View>

        <TransactionList
          transactions={displayedTransactions}
          onPress={(transaction) => setSelectedTransactionId(transaction.id)}
        />
      </View>
      </TabPage>
      {selectedTransaction ? (
        <TransactionDetailSheet
          transaction={selectedTransaction}
          onDismiss={() => setSelectedTransactionId(null)}
        />
      ) : null}
    </>
  );
}
