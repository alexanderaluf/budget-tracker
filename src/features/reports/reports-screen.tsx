import { Chip } from "heroui-native";

import { useLocalData } from "@/data/local-data-provider";
import {
    selectDailySpending,
    selectMonthlySummary,
    selectSpendingCategories,
} from "@/data/selectors/document-selectors";
import { PageHeader } from "@/shared/ui/page-header";
import { TabPage } from "@/shared/ui/tab-page";

import { CategoryBreakdown } from "./components/category-breakdown";
import { SpendingChartCard } from "./components/spending-chart-card";
export function ReportsScreen() {
  const { document } = useLocalData();
  const summary = selectMonthlySummary(document);
  const dailySpending = selectDailySpending(document);
  const spendingCategories = selectSpendingCategories(document);
  const dailyAverage = summary.spent / Math.max(new Date().getDate(), 1);

  return (
    <TabPage>
      <PageHeader
        action={
          <Chip color="default" size="sm" variant="secondary">
            <Chip.Label className="font-manrope-bold">September</Chip.Label>
          </Chip>
        }
        description="Understand where your money went and how spending is changing."
        eyebrow="Insights"
        title="Reports"
      />

      <SpendingChartCard
        changePercent={0}
        dailyAverage={dailyAverage}
        dailySpending={dailySpending}
        totalSpent={summary.spent}
      />
      <CategoryBreakdown categories={spendingCategories} />
    </TabPage>
  );
}
