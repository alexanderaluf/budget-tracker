import type { Account, AccountPeriod, AccountTransaction } from "@/features/accounts/types";
import type { AccountDraft } from "../model/account-record";
import { ACCOUNT_ICONS } from "@/features/accounts/account-options";
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
  const profileId = document._local.selectedProfileId;
  const owner = document.users.find(
    (user) => String(user.uuid ?? user.id) === profileId,
  );
  return document.accounts
    .filter(
      (record) =>
        !profileId ||
        record.user == null ||
        record.user === profileId ||
        (owner?.id != null && record.user === owner.id),
    )
    .map((record, index) => {
      const institution = text(record.bankName, "Local account");
      const normalized = `${text(record.name)} ${institution}`.toLowerCase();
      const kind =
        record.accountType === "card"
          ? "credit"
          : record.accountType === "cash"
            ? "cash"
            : record.accountType === "savings"
              ? "savings"
              : record.type === 1
                ? "cash"
                : record.type === 2
                  ? "savings"
                  : normalized.includes("credit")
                    ? "credit"
                    : normalized.includes("saving")
                      ? "savings"
                      : "checking";
      const storedIcon = text(record.icon);
      const storedIconPath = text(record.iconPath);
      const materialIconIsValid =
        storedIcon.startsWith("material:") &&
        /^[Mm]/.test(storedIconPath) &&
        storedIconPath.length <= 20_000;

      return {
        id: recordId(record, index),
        accountNumber: text(record.accountNumber),
        ownerName: text(document.users.find((user) => user.uuid === record.user || user.id === record.user)?.name),
        ...accountActivityTotals(document, record),
        name: text(record.name, `Account ${index + 1}`),
        institution,
        kind,
        balance: number(record.amount),
        lastFour: text(record.cardLastFour, text(record.accountNumber)).slice(
          -4,
        ),
        icon: materialIconIsValid
          ? storedIcon
          : (ACCOUNT_ICONS.find(
              (icon) =>
                !icon.name.startsWith("material:") && icon.name === record.icon,
            )?.name ??
            (kind === "cash"
              ? "cash"
              : kind === "credit"
                ? "credit-card"
                : kind === "savings"
                  ? "piggy-bank"
                  : "bank")),
        iconPath: materialIconIsValid ? storedIconPath : null,
        color: /^#[a-f\d]{6}$/i.test(text(record.color))
          ? text(record.color)
          : colors[index % colors.length],
        iconBackground: /^#[a-f\d]{6}$/i.test(text(record.color))
          ? `${text(record.color)}26`
          : ["#17343c", "#2f2942", "#3b3020", "#402523"][index % 4],
        currencyCode: /^[A-Z]{3}$/.test(text(record.currencyCode).toUpperCase())
          ? text(record.currencyCode).toUpperCase()
          : "USD",
        isDefault: record.isDefault === true,
        isExcluded: record.isExcluded === true,
        cardCompany: text(record.cardCompany),
        paymentDay:
          typeof record.paymentDay === "number" &&
          Number.isInteger(record.paymentDay) &&
          record.paymentDay >= 1 &&
          record.paymentDay <= 31
            ? record.paymentDay
            : null,
      };
    });
}

function belongsToAccount(transaction: JsonObject, account: JsonObject) {
  return [account.uuid, account.id].some((id) => id != null && transaction.account === id);
}

function accountActivityTotals(document: BackupDocument, account: JsonObject) {
  const currency = text(account.currencyCode, "USD").toUpperCase();
  const records = document.transactions.filter((item) =>
    belongsToAccount(item, account) && text(item.currencyCode, currency).toUpperCase() === currency,
  );
  return {
    income: records.filter((item) => item.type === 1).reduce((sum, item) => sum + Math.abs(number(item.amount)), 0),
    expense: records.filter((item) => item.type === 0).reduce((sum, item) => sum + Math.abs(number(item.amount)), 0),
  };
}

export function selectAccountTransactions(document: BackupDocument, accountId: string): AccountTransaction[] {
  const account = selectAccounts(document).find((item) => item.id === accountId);
  const record = document.accounts.find((item) => String(item.uuid ?? item.id) === accountId);
  if (!account || !record) return [];
  return document.transactions.filter((item) => belongsToAccount(item, record)).map((item, index) => {
    const timestamp = new Date(text(item.date, text(item.createdAt))).getTime();
    const type = item.type === 1 ? "income" : item.type === 0 ? "expense" : "transfer";
    return {
      id: recordId(item, index),
      name: text(item.name, "Untitled transaction"),
      category: text(item.categoryName, lookupName(document.categories, item.category)),
      amount: Math.abs(number(item.amount)),
      type,
      currencyCode: /^[A-Z]{3}$/.test(text(item.currencyCode).toUpperCase()) ? text(item.currencyCode).toUpperCase() : account.currencyCode,
      timestamp: Number.isFinite(timestamp) ? timestamp : null,
    } satisfies AccountTransaction;
  }).sort((a, b) => (b.timestamp ?? -Infinity) - (a.timestamp ?? -Infinity));
}

export function accountPeriodRange(period: AccountPeriod, anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  if (period === "Weekly") start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  if (period === "Monthly") start.setDate(1);
  if (period === "Yearly") start.setMonth(0, 1);
  const end = new Date(start);
  if (period === "Yearly") end.setFullYear(end.getFullYear() + 1);
  else if (period === "Monthly") end.setMonth(end.getMonth() + 1);
  else end.setDate(end.getDate() + (period === "Weekly" ? 7 : 1));
  return { start, end };
}

export function filterAccountTransactions(transactions: AccountTransaction[], period: AccountPeriod, anchor: Date) {
  const { start, end } = accountPeriodRange(period, anchor);
  return transactions.filter((item) => item.timestamp != null && item.timestamp >= start.getTime() && item.timestamp < end.getTime());
}

export function selectAccountDraft(document: BackupDocument, id: string): AccountDraft | null {
  const account = selectAccounts(document).find((item) => item.id === id);
  if (!account) return null;
  return {
    name: account.name, amount: String(account.balance), accountNumber: account.accountNumber,
    accountType: account.kind === "cash" ? "cash" : account.kind === "savings" ? "savings" : "card",
    currencyCode: account.currencyCode, icon: account.icon, iconPath: account.iconPath,
    color: account.color, isDefault: account.isDefault, isExcluded: account.isExcluded,
    cardLastFour: account.lastFour, cardCompany: account.cardCompany, paymentDay: account.paymentDay,
  };
}

export function selectAccountTotals(accounts: Account[]) {
  const included = accounts.filter((account) => !account.isExcluded);
  const assets = included.reduce(
    (total, account) => total + Math.max(account.balance, 0),
    0,
  );
  const liabilities = included.reduce(
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

export function selectAccountTotalsByCurrency(accounts: Account[]) {
  return [...new Set(accounts.map((account) => account.currencyCode))].map(
    (currencyCode) => ({
      currencyCode,
      ...selectAccountTotals(
        accounts.filter((account) => account.currencyCode === currencyCode),
      ),
    }),
  );
}

// Exclusion affects calculations; records remain visible in activity and search.
function includedTransactions(document: BackupDocument) {
  const excludedIds = new Set<JsonValue>(
    document.accounts
      .filter((account) => account.isExcluded === true)
      .flatMap((account) => [account.uuid, account.id])
      .filter((id) => id != null),
  );
  return document.transactions.filter(
    (transaction) => !excludedIds.has(transaction.account),
  );
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
  const values = includedTransactions(document).map(transactionAmount);
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
    const spent = includedTransactions(document)
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
  for (const transaction of includedTransactions(document)) {
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
  for (const transaction of includedTransactions(document)) {
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
