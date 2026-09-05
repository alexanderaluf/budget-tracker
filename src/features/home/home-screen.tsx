import { Button } from "heroui-native";
import { Bell, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { TabPage } from "@/shared/ui/tab-page";

import { BudgetCard } from "./components/budget-card";
import { PaymentCard } from "./components/payment-card";
import { TransactionList } from "./components/transaction-list";
import {
    accountSummary,
    budgetCategories,
    primaryCard,
    recentTransactions,
} from "./data/home-data";

export function HomeScreen() {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const displayedTransactions = showAllTransactions
    ? recentTransactions
    : recentTransactions.slice(0, 3);

  return (
    <TabPage>
      <View className="flex-row items-center justify-between pt-3">
        <View className="flex-1 pr-3">
          <Text className="font-manrope-medium text-xs uppercase tracking-widest text-muted">
            Saturday, September 5
          </Text>
          <Text className="mt-1 font-manrope-bold text-2xl text-foreground">
            Good morning, {accountSummary.firstName}
          </Text>
        </View>

        <Button
          accessibilityLabel="View notifications"
          isIconOnly
          size="md"
          variant="outline"
          className="border-border bg-surface"
          onPress={() => Alert.alert("Notifications", "You are all caught up.")}
        >
          <Bell color="#f2f2f2" size={20} strokeWidth={2} />
        </Button>
      </View>

      <PaymentCard
        card={primaryCard}
        isBalanceVisible={isBalanceVisible}
        onToggleBalance={() => setIsBalanceVisible((current) => !current)}
      />

      <BudgetCard
        categories={budgetCategories}
        income={accountSummary.monthlyIncome}
        savingsRate={accountSummary.savingsRate}
        spent={accountSummary.monthlySpent}
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
            <Button.Label className="font-manrope-semibold text-[#70d2eb]">
              {showAllTransactions ? "Show less" : "See all"}
            </Button.Label>
            <ChevronRight color="#70d2eb" size={16} strokeWidth={2.5} />
          </Button>
        </View>

        <TransactionList transactions={displayedTransactions} />
      </View>
    </TabPage>
  );
}
