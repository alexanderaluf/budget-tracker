import { CreditCard, Landmark, PiggyBank } from "lucide-react-native";

import type { Account } from "../types";

export const accounts: Account[] = [
  {
    id: "account-checking",
    name: "Everyday checking",
    institution: "Northstar Bank",
    kind: "checking",
    balance: 4280.5,
    lastFour: "2841",
    icon: Landmark,
    color: "#70d2eb",
    iconBackground: "#17343c",
  },
  {
    id: "account-savings",
    name: "Emergency savings",
    institution: "Northstar Bank",
    kind: "savings",
    balance: 9650,
    lastFour: "9016",
    icon: PiggyBank,
    color: "#b89cf5",
    iconBackground: "#2f2942",
  },
  {
    id: "account-credit",
    name: "Everyday rewards",
    institution: "Summit Credit",
    kind: "credit",
    balance: -1248.35,
    lastFour: "4438",
    icon: CreditCard,
    color: "#f2c66d",
    iconBackground: "#3b3020",
  },
];

export const accountTotals = {
  assets: 13930.5,
  liabilities: 1248.35,
  netWorth: 12682.15,
  monthlyChangePercent: 4.8,
};
