export type AccountKind = "checking" | "savings" | "credit" | "cash";

export type Account = {
  id: string;
  name: string;
  institution: string;
  kind: AccountKind;
  balance: number;
  lastFour: string;
  icon: string;
  iconPath: string | null;
  color: string;
  iconBackground: string;
  currencyCode: string;
  isDefault: boolean;
  isExcluded: boolean;
  cardCompany: string;
  paymentDay: number | null;
  accountNumber: string;
  ownerName: string;
  income: number;
  expense: number;
};

export type AccountPeriod = "Daily" | "Weekly" | "Monthly" | "Yearly";
export type AccountTransaction = {
  id: string;
  name: string;
  category: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  currencyCode: string;
  timestamp: number | null;
};
