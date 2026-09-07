import type { Account } from "@/features/accounts/types";
import type { BudgetCategory, Transaction } from "@/features/home/types";
import type { DailySpend, SpendingCategory } from "@/features/reports/types";
import type { SearchResult } from "@/features/search/types";
import type { FilledIconName } from "@/shared/ui/filled-icon";

import type { BackupDocument } from "../model/backup-document";
import type { JsonObject, JsonValue } from "../model/json";

const colors = ["#70d2eb", "#b89cf5", "#f2c66d", "#ef8175"];

function text(value: JsonValue | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: JsonValue | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function recordId(record: JsonObject, index: number) {
  return text(record.uuid, String(record.id ?? index));
}

function lookupName(records: JsonObject[], id: JsonValue | undefined) {
  if (typeof id !== "string") return "Uncategorized";
  const record = records.find((item) => item.uuid === id);
  return record ? text(record.name, "Uncategorized") : id;
}

function transactionAmount(record: JsonObject) {
  const amount = Math.abs(number(record.amount));
  return number(record.type) === 1 ? amount : -amount;
}

function categoryIcon(category: string): FilledIconName {
  const value = category.toLowerCase();
  if (value.includes("food") || value.includes("dining")) return "food";
  if (value.includes("grocer") || value.includes("shopping")) return "shopping";
  if (value.includes("coffee")) return "coffee";
  if (value.includes("transport") || value.includes("car")) return "car";
  if (value.includes("salary") || value.includes("income")) return "wallet";
  if (value.includes("housing") || value.includes("rent")) return "home";
  return "cash";
}

function transactionDate(record: JsonObject) {
  const value = text(record.createdAt);
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function selectAccounts(document: BackupDocument): Account[] {
  return document.accounts.map((record, index) => {
    const institution = text(record.bankName, "Local account");
    const normalized = `${text(record.name)} ${institution}`.toLowerCase();
    const kind = normalized.includes("credit")
      ? "credit"
      : normalized.includes("saving")
        ? "savings"
        : "checking";

    return {
      id: recordId(record, index),
      name: text(record.name, `Account ${index + 1}`),
      institution,
      kind,
      balance: number(record.amount),
      lastFour: text(record.accountNumber, "••••").slice(-4),
      icon:
        kind === "credit"
          ? "credit-card"
          : kind === "savings"
            ? "piggy-bank"
            : "bank",
      color: colors[index % colors.length],
      iconBackground: ["#17343c", "#2f2942", "#3b3020", "#402523"][index % 4],
    };
  });
}

export function selectAccountTotals(accounts: Account[]) {
  const assets = accounts.reduce(
    (total, account) => total + Math.max(account.balance, 0),
    0,
  );
  const liabilities = accounts.reduce(
    (total, account) => total + Math.abs(Math.min(account.balance, 0)),
    0,
  );
  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
    monthlyChangePercent: 0,
  };
}

export function selectTransactions(document: BackupDocument): Transaction[] {
  return document.transactions
    .map((record, index) => {
      const category = text(
        record.categoryName,
        lookupName(document.categories, record.category),
      );
      return {
        id: recordId(record, index),
        merchant: text(record.name, "Untitled transaction"),
        category,
        occurredAt: transactionDate(record),
        amount: transactionAmount(record),
        icon: categoryIcon(category),
        tone: number(record.type) === 1 ? "blue" : "emerald",
      } satisfies Transaction;
    })
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

export function selectSearchResults(document: BackupDocument): SearchResult[] {
  return document.transactions.map((record, index) => {
    const category = text(
      record.categoryName,
      lookupName(document.categories, record.category),
    );
    const account = text(
      record.accountName,
      lookupName(document.accounts, record.account),
    );
    const income = number(record.type) === 1;
    return {
      id: recordId(record, index),
      title: text(record.name, "Untitled transaction"),
      category,
      account,
      date: transactionDate(record),
      amount: transactionAmount(record),
      icon: categoryIcon(category),
      color: income ? "#82b8ee" : "#70d2eb",
      iconBackground: income ? "#1b2e45" : "#17343c",
    };
  });
}

export function selectMonthlySummary(document: BackupDocument) {
  const values = document.transactions.map(transactionAmount);
  const income = values.filter((value) => value > 0).reduce((a, b) => a + b, 0);
  const spent = Math.abs(
    values.filter((value) => value < 0).reduce((a, b) => a + b, 0),
  );
  const savingsRate =
    income > 0 ? Math.max(Math.round(((income - spent) / income) * 100), 0) : 0;
  return { income, spent, savingsRate };
}

export function selectBudgetCategories(
  document: BackupDocument,
): BudgetCategory[] {
  if (document.budgets.length === 0) return [];

  return document.budgets.slice(0, 4).map((budget, index) => {
    const categoryIds = Array.isArray(budget.categories)
      ? budget.categories
      : [];
    const spent = document.transactions
      .filter((transaction) =>
        categoryIds.some((id) => id === transaction.category),
      )
      .reduce(
        (total, transaction) =>
          total + Math.abs(transactionAmount(transaction)),
        0,
      );
    return {
      id: recordId(budget, index),
      label: text(budget.name, `Budget ${index + 1}`),
      spent,
      limit: Math.max(number(budget.amount), 1),
      color: colors[index % colors.length],
    };
  });
}

export function selectSpendingCategories(
  document: BackupDocument,
): SpendingCategory[] {
  const totals = new Map<string, number>();
  for (const transaction of document.transactions) {
    if (number(transaction.type) === 1) continue;
    const category = text(
      transaction.categoryName,
      lookupName(document.categories, transaction.category),
    );
    totals.set(
      category,
      (totals.get(category) ?? 0) + Math.abs(number(transaction.amount)),
    );
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .sort(([, left], [, right]) => right - left)
    .slice(0, 5)
    .map(([label, amount], index) => ({
      id: label.toLowerCase().replace(/\W+/g, "-"),
      label,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: colors[index % colors.length],
    }));
}

export function selectDailySpending(document: BackupDocument): DailySpend[] {
  const dayTotals = new Map<string, number>();
  for (const transaction of document.transactions) {
    if (number(transaction.type) === 1) continue;
    const date = new Date(text(transaction.createdAt));
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    dayTotals.set(
      key,
      (dayTotals.get(key) ?? 0) + Math.abs(number(transaction.amount)),
    );
  }

  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - offset));
    const key = date.toISOString().slice(0, 10);
    return {
      day: date.toLocaleDateString(undefined, { weekday: "narrow" }),
      amount: dayTotals.get(key) ?? 0,
    };
  });
}
