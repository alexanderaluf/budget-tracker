import {
    Coffee,
    ShoppingBag,
    Utensils,
    WalletCards,
} from "lucide-react-native";

import type { BudgetCategory, PaymentCardDetails, Transaction } from "../types";

export const accountSummary = {
  firstName: "Alex",
  monthlyIncome: 6250,
  monthlySpent: 3784.2,
  savingsRate: 28,
};

export const primaryCard: PaymentCardDetails = {
  issuer: "Northstar",
  tier: "Signature debit",
  cardholder: "Alex Morgan",
  lastFour: "2841",
  expiresAt: "09/29",
  balance: 8420.5,
  brand: "visa",
};

export const budgetCategories: BudgetCategory[] = [
  {
    id: "needs",
    label: "Needs",
    spent: 2180,
    limit: 3000,
    color: "#70d2eb",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    spent: 930,
    limit: 1400,
    color: "#f2c66d",
  },
  {
    id: "goals",
    label: "Goals",
    spent: 674.2,
    limit: 1200,
    color: "#b89cf5",
  },
];

export const recentTransactions: Transaction[] = [
  {
    id: "tx-001",
    merchant: "Green Basket",
    category: "Groceries",
    occurredAt: "Today, 10:24 AM",
    amount: -86.4,
    icon: ShoppingBag,
    tone: "emerald",
  },
  {
    id: "tx-002",
    merchant: "Salary deposit",
    category: "Income",
    occurredAt: "Today, 8:00 AM",
    amount: 3125,
    icon: WalletCards,
    tone: "blue",
  },
  {
    id: "tx-003",
    merchant: "Table & Thyme",
    category: "Dining",
    occurredAt: "Yesterday, 7:42 PM",
    amount: -64.8,
    icon: Utensils,
    tone: "rose",
  },
  {
    id: "tx-004",
    merchant: "Northline Coffee",
    category: "Coffee",
    occurredAt: "Yesterday, 9:13 AM",
    amount: -6.75,
    icon: Coffee,
    tone: "amber",
  },
];
