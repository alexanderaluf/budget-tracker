import type { FilledIconName } from "@/shared/ui/filled-icon";

export type TransactionTone = "emerald" | "blue" | "amber" | "rose";

export type Transaction = {
  id: string;
  merchant: string;
  category: string;
  occurredAt: string;
  amount: number;
  icon: FilledIconName;
  tone: TransactionTone;
};

export type BudgetCategory = {
  id: string;
  label: string;
  spent: number;
  limit: number;
  color: string;
};

export type PaymentCardDetails = {
  issuer: string;
  tier: string;
  cardholder: string;
  lastFour: string;
  expiresAt: string;
  balance: number;
  brand: "visa" | "mastercard" | "amex";
};
