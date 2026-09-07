import { Card, Chip } from "heroui-native";
import { Text, View } from "react-native";

import { formatCurrency } from "@/shared/lib/currency";
import { FilledIcon } from "@/shared/ui/filled-icon";

import type { DailySpend } from "../types";

type SpendingChartCardProps = {
  totalSpent: number;
  changePercent: number;
  dailyAverage: number;
  dailySpending: DailySpend[];
};

export function SpendingChartCard({
  totalSpent,
  changePercent,
  dailyAverage,
  dailySpending,
}: SpendingChartCardProps) {
  const maximum = Math.max(...dailySpending.map((item) => item.amount), 1);

  return (
    <Card className="border border-[#2d2d2d] bg-[#171717] p-0">
      <Card.Header className="flex-row items-start justify-between px-5 pt-5">
        <View>
          <Card.Description className="font-sans text-muted">
            Total spent this month
          </Card.Description>
          <Card.Title className="mt-1 font-manrope-bold text-[32px] text-foreground">
            {formatCurrency(totalSpent)}
          </Card.Title>
        </View>
        <Chip color="success" size="sm" variant="soft">
          <FilledIcon color="#70d2eb" name="trending-down" size={15} />
          <Chip.Label className="font-manrope-bold">
            {Math.abs(changePercent)}%
          </Chip.Label>
        </Chip>
      </Card.Header>

      <Card.Body className="gap-4 px-5 pb-5 pt-6">
        <View className="h-32 flex-row items-end justify-between gap-2">
          {dailySpending.map((item, index) => (
            <View
              key={`${item.day}-${index}`}
              className="flex-1 items-center gap-2"
            >
              <View className="h-24 w-full justify-end overflow-hidden rounded-md bg-[#242424]">
                <View
                  className="w-full rounded-md bg-[#70d2eb]"
                  style={{
                    height: `${Math.max((item.amount / maximum) * 100, 12)}%`,
                  }}
                />
              </View>
              <Text className="font-manrope-semibold text-[10px] text-muted">
                {item.day}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row items-center justify-between border-t border-border pt-4">
          <Text className="font-sans text-xs text-muted">Daily average</Text>
          <Text className="font-manrope-bold text-sm text-foreground">
            {formatCurrency(dailyAverage)}
          </Text>
        </View>
      </Card.Body>
    </Card>
  );
}
