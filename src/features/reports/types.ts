export type SpendingCategory = {
  id: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
};

export type DailySpend = {
  day: string;
  amount: number;
};
