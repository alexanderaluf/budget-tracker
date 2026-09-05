import { Card, Chip } from "heroui-native";
import { Text, View } from "react-native";

import { formatCurrency } from "@/shared/lib/currency";
import { ProgressBar } from "@/shared/ui/progress-bar";

import type { BudgetCategory } from "../types";

type BudgetCardProps = {
  categories: BudgetCategory[];
  spent: number;
  income: number;
  savingsRate: number;
};

export function BudgetCard({
  categories,
  spent,
  income,
  savingsRate,
}: BudgetCardProps) {
  return (
    <Card className="border border-border bg-surface p-0">
      <Card.Header className="flex-row items-center justify-between px-5 pt-5">
        <View>
          <Card.Title className="font-manrope-bold text-lg text-foreground">
            September plan
          </Card.Title>
          <Card.Description className="mt-0.5 font-sans text-muted">
            {formatCurrency(spent)} of {formatCurrency(income)} used
          </Card.Description>
        </View>
        <Chip color="success" size="sm" variant="soft">
          <Chip.Label className="font-manrope-semibold">
            {savingsRate}% saved
          </Chip.Label>
        </Chip>
      </Card.Header>

      <Card.Body className="gap-5 px-5 pb-5 pt-6">
        {categories.map((category) => {
          const progress = category.spent / category.limit;

          return (
            <View key={category.id} className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-manrope-semibold text-[13px] text-foreground">
                  {category.label}
                </Text>
                <Text className="font-manrope-medium text-xs text-muted">
                  {formatCurrency(category.spent)} /{" "}
                  {formatCurrency(category.limit)}
                </Text>
              </View>
              <ProgressBar value={progress} color={category.color} />
            </View>
          );
        })}
      </Card.Body>
    </Card>
  );
}
