import { Card } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Text } from "@/shared/ui/app-text";

import { formatCurrency } from "@/shared/lib/currency";
import { ProgressBar } from "@/shared/ui/progress-bar";

import type { SpendingCategory } from "../types";

type CategoryBreakdownProps = {
  categories: SpendingCategory[];
  currencyCode: string;
};

export function CategoryBreakdown({
  categories,
  currencyCode,
}: CategoryBreakdownProps) {
  const { i18n, t } = useTranslation();
  const percentageFormatter = new Intl.NumberFormat(i18n.resolvedLanguage, {
    style: "percent",
    maximumFractionDigits: 1,
  });

  return (
    <Card className="border border-border bg-surface p-0">
      <Card.Header className="px-5 pb-2 pt-5">
        <Card.Title className="font-manrope-bold text-lg text-foreground">
          {t("reports.categories.title")}
        </Card.Title>
        <Card.Description className="mt-1 font-sans text-muted">
          {t("reports.categories.description")}
        </Card.Description>
      </Card.Header>

      <Card.Body className="gap-5 px-5 pb-5 pt-4">
        {categories.length === 0 ? (
          <Text className="py-4 text-center font-sans text-sm text-muted">
            {t("reports.categories.empty")}
          </Text>
        ) : null}
        {categories.map((category) => {
          const amount = formatCurrency(category.amount, currencyCode);
          const percentage = percentageFormatter.format(
            category.percentage / 100,
          );
          return (
            <View
              key={category.id}
              accessible
              accessibilityLabel={t("reports.categories.itemAccessibility", {
                label: category.label,
                amount,
                percentage,
              })}
              className="gap-2"
            >
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
                    {amount}
                  </Text>
                  <Text className="font-sans text-[10px] text-muted">
                    {percentage}
                  </Text>
                </View>
              </View>
              <ProgressBar
                value={category.percentage / 100}
                color={category.color}
              />
            </View>
          );
        })}
      </Card.Body>
    </Card>
  );
}
