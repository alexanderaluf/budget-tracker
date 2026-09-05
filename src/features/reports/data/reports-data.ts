import type { DailySpend, SpendingCategory } from "../types";

export const reportSummary = {
  totalSpent: 3784.2,
  previousMonth: 4102.6,
  dailyAverage: 126.14,
  changePercent: -7.8,
};

export const dailySpending: DailySpend[] = [
  { day: "M", amount: 92 },
  { day: "T", amount: 148 },
  { day: "W", amount: 76 },
  { day: "T", amount: 182 },
  { day: "F", amount: 135 },
  { day: "S", amount: 218 },
  { day: "S", amount: 104 },
];

export const spendingCategories: SpendingCategory[] = [
  {
    id: "housing",
    label: "Housing",
    amount: 1450,
    percentage: 38,
    color: "#70d2eb",
  },
  {
    id: "food",
    label: "Food & dining",
    amount: 826.4,
    percentage: 22,
    color: "#f2c66d",
  },
  {
    id: "transport",
    label: "Transport",
    amount: 548.8,
    percentage: 15,
    color: "#b89cf5",
  },
  {
    id: "other",
    label: "Other",
    amount: 959,
    percentage: 25,
    color: "#ef8175",
  },
];
