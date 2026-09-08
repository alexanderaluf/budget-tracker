import type { SavingsAccountSummary } from "@/data/model/savings-account";

export type AccountKind = "bank" | "checking" | "savings" | "credit" | "cash";

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
  bankName: string;
  linkedBankAccountId: string | null;
  linkedBankAccountName: string;
  accountNumber: string;
  ownerName: string;
  income: number;
  expense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsSummary: SavingsAccountSummary | null;
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
