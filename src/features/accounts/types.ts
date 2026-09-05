import type { LucideIcon } from "lucide-react-native";

export type AccountKind = "checking" | "savings" | "credit";

export type Account = {
  id: string;
  name: string;
  institution: string;
  kind: AccountKind;
  balance: number;
  lastFour: string;
  icon: LucideIcon;
  color: string;
  iconBackground: string;
};
