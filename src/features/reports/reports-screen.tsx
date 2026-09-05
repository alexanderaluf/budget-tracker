import { Chip } from "heroui-native";

import { PageHeader } from "@/shared/ui/page-header";
import { TabPage } from "@/shared/ui/tab-page";

import { CategoryBreakdown } from "./components/category-breakdown";
import { SpendingChartCard } from "./components/spending-chart-card";
import {
    dailySpending,
    reportSummary,
    spendingCategories,
} from "./data/reports-data";

export function ReportsScreen() {
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
        changePercent={reportSummary.changePercent}
        dailyAverage={reportSummary.dailyAverage}
        dailySpending={dailySpending}
        totalSpent={reportSummary.totalSpent}
      />
      <CategoryBreakdown categories={spendingCategories} />
    </TabPage>
  );
}
