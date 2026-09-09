import type { BackupDocument } from "./backup-document";
import {
  belongsToProfile,
  categoryFamily,
  categoryProfileId,
  identity,
  references,
} from "./category-record";
import type { JsonObject, JsonValue } from "./json";

export const BUDGET_PERIODS = [
  "Daily",
  "Weekly",
  "Monthly",
  "Yearly",
  "Custom",
] as const;
export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];
export type BudgetDraft = {
  name: string;
  amount: string;
  transactionType: 0 | 1 | 2;
  budgetMode: "Automatic" | "Manual";
  budgetType: "Category" | "Overall";
  period: BudgetPeriod;
  categories: string[];
  accounts: string[];
  includeSubcategories: boolean;
  rolling: boolean;
  showOnHome: boolean;
  cycleDay: string;
  startDate: string;
  endDate: string;
  currencyCode: string;
  notes: string;
  color: string;
  icon: string;
  iconPath: string | null;
};
const str = (value: JsonValue | undefined, fallback = "") =>
  typeof value === "string" ? value : fallback;
export function budgetDefaults(): BudgetDraft {
  return {
    name: "",
    amount: "",
    transactionType: 0,
    budgetMode: "Automatic",
    budgetType: "Category",
    period: "Monthly",
    categories: [],
    accounts: [],
    includeSubcategories: false,
    rolling: false,
    showOnHome: false,
    cycleDay: "",
    startDate: "",
    endDate: "",
    currencyCode: "USD",
    notes: "",
    color: "#5c6bc0",
    icon: "wallet",
    iconPath: null,
  };
}
export function normalizeBudgetRecord(record: JsonObject): JsonObject {
  const { amount, cycleDay, currencyCode, ...defaults } = budgetDefaults();
  return { ...defaults, cycleDay: 1, ...record };
}
export function budgetDraft(record: JsonObject, currency = "USD"): BudgetDraft {
  const d = budgetDefaults();
  const ids = (v: JsonValue | undefined) =>
    Array.isArray(v)
      ? v
          .filter((x) => typeof x === "string" || typeof x === "number")
          .map(String)
      : [];
  return {
    ...d,
    name: str(record.name),
    amount: String(record.amount ?? ""),
    transactionType:
      record.transactionType === 1 ? 1 : record.transactionType === 2 ? 2 : 0,
    budgetMode: record.budgetMode === "Manual" ? "Manual" : "Automatic",
    budgetType: record.budgetType === "Overall" ? "Overall" : "Category",
    period: BUDGET_PERIODS.find((p) => p === record.period) ?? "Monthly",
    categories: ids(record.categories),
    accounts: ids(record.accounts),
    includeSubcategories: record.includeSubcategories === true,
    rolling: record.rolling === true,
    showOnHome: record.showOnHome === true,
    cycleDay: String(record.cycleDay ?? 1),
    startDate: str(record.startDate),
    endDate: str(record.endDate),
    notes: str(record.notes),
    currencyCode: /^[A-Z]{3}$/.test(str(record.currencyCode))
      ? str(record.currencyCode)
      : currency,
    color: /^#[a-f\d]{6}$/i.test(str(record.color))
      ? str(record.color)
      : d.color,
    icon: str(record.icon, d.icon),
    iconPath: /^[Mm]/.test(str(record.iconPath)) && str(record.iconPath).length <= 20_000 ? str(record.iconPath) : null,
  };
}
export function parseBudgetDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
    ? date
    : null;
}
export function saveBudget(
  document: BackupDocument,
  draft: BudgetDraft,
  id: string,
  now: string,
  editing = false,
): BackupDocument {
  const existing = document.budgets.find((b) => identity(b) === id);
  if (!id || (editing && !existing))
    throw new Error("This budget no longer exists.");
  if (existing && !belongsToProfile(document, existing))
    throw new Error("This budget belongs to another profile.");
  const amount = Number(draft.amount);
  if (!draft.name.trim() || draft.name.trim().length > 100)
    throw new Error("Enter a budget name (up to 100 characters).");
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12)
    throw new Error(
      "Enter an amount greater than zero and no more than one trillion.",
    );
  if (
    ![0, 1, 2].includes(draft.transactionType) ||
    !BUDGET_PERIODS.includes(draft.period)
  )
    throw new Error("Choose a valid transaction type and period.");
  if (
    !/^#[a-f\d]{6}$/i.test(draft.color) ||
    !/^[A-Z]{3}$/.test(draft.currencyCode)
  )
    throw new Error("Choose a valid color and currency.");
  const cycleDay = draft.cycleDay.trim() ? Number(draft.cycleDay) : 1;
  if (!Number.isInteger(cycleDay) || cycleDay < 1 || cycleDay > 31)
    throw new Error("Monthly cycle day must be from 1 to 31.");
  if (draft.period === "Custom") {
    const start = parseBudgetDate(draft.startDate),
      end = parseBudgetDate(draft.endDate);
    if (!start || !end || end < start)
      throw new Error("Enter a valid custom date range using YYYY-MM-DD.");
  }
  if (draft.budgetType === "Category" && !draft.categories.length)
    throw new Error("Select at least one category to track.");
  for (const categoryId of draft.budgetType === "Category" ? draft.categories : []) {
    const category = document.categories.find((c) => references(c, categoryId));
    if (
      !category ||
      !belongsToProfile(document, category) ||
      Number(category.type ?? 0) !== draft.transactionType
    )
      throw new Error(
        "Select categories of this transaction type in the current profile.",
      );
  }
  for (const accountId of draft.accounts) {
    const account = document.accounts.find((a) => references(a, accountId));
    if (!account || !belongsToProfile(document, account))
      throw new Error("Select accounts in the current profile.");
  }
  const record: JsonObject = {
    ...existing,
    ...draft,
    uuid: existing?.uuid ?? id,
    user: existing ? existing.user ?? null : categoryProfileId(document),
    amount,
    cycleDay,
    categories: [...new Set(draft.categories)],
    accounts: [...new Set(draft.accounts)],
    name: draft.name.trim(),
    notes: draft.notes.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  return {
    ...document,
    budgets: existing
      ? document.budgets.map((b) => (identity(b) === id ? record : b))
      : [...document.budgets, record],
  };
}

export type BudgetTransactionDraft = {
  name: string;
  amount: string;
  accountId: string;
  categoryId: string;
  toAccountId: string;
  date: string;
};
export function addBudgetTransaction(
  document: BackupDocument,
  budgetId: string,
  draft: BudgetTransactionDraft,
  id: string,
  now: string,
): BackupDocument {
  const budget = document.budgets.find((b) => identity(b) === budgetId);
  if (!budget || !belongsToProfile(document, budget))
    throw new Error("This budget is unavailable.");
  if (document.transactions.some((t) => references(t, id)))
    throw new Error("This transaction has already been saved.");
  const settings = budgetDraft(budget);
  const amount = Number(draft.amount),
    date = parseBudgetDate(draft.date);
  if (
    !draft.name.trim() ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1e12 ||
    !date
  )
    throw new Error("Enter a name, a positive amount, and a valid date.");
  const account = document.accounts.find((a) => references(a, draft.accountId));
  const category = document.categories.find((c) =>
    references(c, draft.categoryId),
  );
  if (!account || !belongsToProfile(document, account))
    throw new Error("Choose an account in this profile.");
  if (
    !category ||
    !belongsToProfile(document, category) ||
    Number(category.type ?? 0) !== settings.transactionType
  )
    throw new Error("Choose a category for this transaction type.");
  const currencyCode = String(account.currencyCode ?? "USD").toUpperCase();
  if (settings.accounts.length && !settings.accounts.some(id => references(account,id)))
    throw new Error("Choose an account selected by this budget.");
  if (settings.budgetType === "Category") {
    const selected = document.categories.filter(c => settings.categories.some(id => references(c,id)));
    const scope = new Set(selected.map(identity));
    if (settings.budgetMode === "Automatic" || settings.includeSubcategories)
      selected.forEach(c => categoryFamily(document.categories,identity(c)).forEach(id => scope.add(id)));
    if (!scope.has(identity(category))) throw new Error("Choose a category tracked by this budget.");
  }
  if (budget.currencyCode && currencyCode !== budget.currencyCode)
    throw new Error("Choose an account in this budget’s currency.");
  const destination = document.accounts.find((a) =>
    references(a, draft.toAccountId),
  );
  if (
    settings.transactionType === 2 &&
    (!destination ||
      !belongsToProfile(document, destination) ||
      identity(destination) === identity(account) ||
      String(destination.currencyCode ?? "USD").toUpperCase() !== currencyCode)
  )
    throw new Error(
      "Choose a different destination account in the same currency.",
    );
  const today = new Date(now);
  if (date > today) throw new Error("Choose today or an earlier date.");
  const stamp =
    date.toDateString() === today.toDateString() ? now : date.toISOString();
  const accounts = document.accounts.map((a) => {
    let delta = 0;
    if (identity(a) === identity(account))
      delta = settings.transactionType === 1 ? amount : -amount;
    if (
      settings.transactionType === 2 &&
      destination &&
      identity(a) === identity(destination)
    )
      delta = amount;
    if (!delta) return a;
    if (
      typeof a.amount !== "number" ||
      !Number.isFinite(a.amount) ||
      !Number.isFinite(a.amount + delta)
    )
      throw new Error(
        "This account has an invalid balance. Edit the account before adding a transaction.",
      );
    return {
      ...a,
      amount: Math.round((a.amount + delta) * 1e8) / 1e8,
      updatedAt: now,
      ...(Array.isArray(a.transactions)
        ? { transactions: [...new Set([...a.transactions, id])] }
        : {}),
    };
  });
  return {
    ...document,
    accounts,
    categories: document.categories.map(c => identity(c) === identity(category) && Array.isArray(c.transactions)
      ? {...c,transactions:[...new Set([...c.transactions,id])],updatedAt:now} : c),
    transactions: [
      ...document.transactions,
      {
        uuid: id,
        name: draft.name.trim(),
        amount,
        type: settings.transactionType,
        currencyCode,
        account: identity(account),
        accountName: account.name ?? "",
        category: identity(category),
        categoryName: category.name ?? "",
        ...(settings.transactionType === 2 && destination
          ? { fromAccount: identity(account), toAccount: identity(destination) }
          : {}),
        user: categoryProfileId(document),
        date: stamp,
        createdAt: now,
        updatedAt: now,
        tags: [],
      },
    ],
  };
}
