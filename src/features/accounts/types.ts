import type { FilledIconName } from "@/shared/ui/filled-icon";

export type AccountKind = "checking" | "savings" | "credit";

export type Account = {
  id: string;
  name: string;
  institution: string;
  kind: AccountKind;
  balance: number;
  lastFour: string;
  icon: FilledIconName;
  color: string;
  iconBackground: string;
};
