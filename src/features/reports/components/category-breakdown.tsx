import { Card } from "heroui-native";
import { Text, View } from "react-native";

import { formatCurrency } from "@/shared/lib/currency";
import { ProgressBar } from "@/shared/ui/progress-bar";

import type { SpendingCategory } from "../types";

type CategoryBreakdownProps = {
  categories: SpendingCategory[];
};

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  return (
    <Card className="border border-border bg-surface p-0">
      <Card.Header className="px-5 pb-2 pt-5">
        <Card.Title className="font-manrope-bold text-lg text-foreground">
          Category breakdown
        </Card.Title>
        <Card.Description className="mt-1 font-sans text-muted">
          Share of total spending
        </Card.Description>
      </Card.Header>

      <Card.Body className="gap-5 px-5 pb-5 pt-4">
        {categories.map((category) => (
          <View key={category.id} className="gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <Text className="font-manrope-semibold text-sm text-foreground">
                  {category.label}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-manrope-bold text-sm text-foreground">
                  {formatCurrency(category.amount)}
                </Text>
                <Text className="font-sans text-[10px] text-muted">
                  {category.percentage}%
                </Text>
              </View>
            </View>
            <ProgressBar
              value={category.percentage / 100}
              color={category.color}
            />
          </View>
        ))}
      </Card.Body>
    </Card>
  );
}
