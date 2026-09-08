import type { FilledIconName } from "@/shared/ui/filled-icon";

export type SearchResult = {
  id: string;
  title: string;
  category: string;
  account: string;
  date: string;
  amount: number;
  icon: FilledIconName;
};
