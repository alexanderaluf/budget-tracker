import type { LucideIcon } from "lucide-react-native";

export type SearchResult = {
  id: string;
  title: string;
  category: string;
  account: string;
  date: string;
  amount: number;
  icon: LucideIcon;
  color: string;
  iconBackground: string;
};
