import { i18n } from "@/localization/i18n";

import type { BackupDocument } from "./backup-document";
import {
  belongsToProfile,
  categoryParent,
  categoryProfileId,
  identity,
  references,
} from "./category-record";
import type { JsonObject, JsonValue } from "./json";

export const TRANSACTION_TYPES = [0, 1, 2] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type TransactionDraft = {
  type: TransactionType;
  name: string;
  amount: string;
  description: string;
  occurredAt: string;
  accountId: string;
  destinationAccountId: string;
  categoryId: string;
  budgetId: string;
  labelId: string;
  loanId: string;
  placeId: string;
  personId: string;
  receiptPath: string | null;
  receiptAttachmentId: string | null;
};

export function createTransactionDraft(
  type: TransactionType = 0,
): TransactionDraft {
  return {
    type,
    name: "",
    amount: "",
    description: "",
    occurredAt: new Date().toISOString(),
    accountId: "",
    destinationAccountId: "",
    categoryId: "",
    budgetId: "",
    labelId: "",
    loanId: "",
    placeId: "",
    personId: "",
    receiptPath: null,
    receiptAttachmentId: null,
  };
}

function findRecord(
  records: JsonObject[],
  value: JsonValue | undefined,
) {
  return records.find((record) => references(record, value));
}

function transactionType(record: JsonObject): TransactionType {
  return record.type === 1 ? 1 : record.type === 2 ? 2 : 0;
}

function sourceReference(record: JsonObject) {
  return record.account ?? record.fromAccount ?? record.sourceAccount;
}

function destinationReference(record: JsonObject) {
  return record.toAccount ?? record.destinationAccount;
}

function transactionEffect(
  document: BackupDocument,
  record: JsonObject,
  direction: 1 | -1,
) {
  const amount = Math.abs(Number(record.amount));
  if (!Number.isFinite(amount))
    throw new Error(i18n.t("validation.transaction.invalidAmount"));
  const type = transactionType(record);
  const source = findRecord(document.accounts, sourceReference(record));
  const destination =
    type === 2
      ? findRecord(document.accounts, destinationReference(record))
      : undefined;
  const effect = new Map<string, number>();
  if (source)
    effect.set(identity(source), direction * (type === 1 ? amount : -amount));
  if (destination)
    effect.set(
      identity(destination),
      (effect.get(identity(destination)) ?? 0) + direction * amount,
    );
  return effect;
}

function mergeEffects(...effects: Map<string, number>[]) {
  const merged = new Map<string, number>();
  for (const effect of effects)
    for (const [id, delta] of effect)
      merged.set(id, (merged.get(id) ?? 0) + delta);
  return merged;
}

function relatedAccountIds(document: BackupDocument, record?: JsonObject) {
  if (!record) return new Set<string>();
  const ids = [
    findRecord(document.accounts, sourceReference(record)),
    findRecord(document.accounts, destinationReference(record)),
  ]
    .filter((account): account is JsonObject => !!account)
    .map(identity);
  return new Set(ids);
}

function updateReferences(
  values: JsonValue[],
  transactionId: string,
  shouldContain: boolean,
) {
  const filtered = values.filter(
    (value) => String(value) !== transactionId,
  );
  return shouldContain ? [...filtered, transactionId] : filtered;
}

function resolveDraft(
  document: BackupDocument,
  draft: TransactionDraft,
  profileId: string,
) {
  const amount = Number(draft.amount.replace(",", "."));
  const occurredAt = new Date(draft.occurredAt);
  if (!draft.name.trim() || draft.name.trim().length > 100)
    throw new Error(i18n.t("validation.transaction.name"));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12)
    throw new Error(i18n.t("validation.transaction.amount"));
  if (!TRANSACTION_TYPES.includes(draft.type))
    throw new Error(i18n.t("validation.transaction.type"));
  if (!Number.isFinite(occurredAt.getTime()))
    throw new Error(i18n.t("validation.transaction.dateTime"));
  const account = findRecord(document.accounts, draft.accountId);
  if (!account || !belongsToProfile(document, account, profileId))
    throw new Error(i18n.t("validation.transaction.account"));
  const destination = draft.destinationAccountId
    ? findRecord(document.accounts, draft.destinationAccountId)
    : undefined;
  if (
    draft.type === 2 &&
    (!destination ||
      !belongsToProfile(document, destination, profileId) ||
      identity(destination) === identity(account))
  )
    throw new Error(i18n.t("validation.transaction.destinationAccount"));
  const currencyCode = String(account.currencyCode ?? "USD").toUpperCase();
  if (
    draft.type === 2 &&
    String(destination?.currencyCode ?? "USD").toUpperCase() !== currencyCode
  )
    throw new Error(i18n.t("validation.transaction.transferCurrency"));
  const category = draft.categoryId
    ? findRecord(document.categories, draft.categoryId)
    : undefined;
  if (
    category &&
    (!belongsToProfile(document, category, profileId) ||
      transactionType(category) !== draft.type)
  )
    throw new Error(i18n.t("validation.transaction.category"));
  if (
    category &&
    document.categories.some((candidate) =>
      references(category, categoryParent(candidate)),
    )
  )
    throw new Error(
      i18n.t("validation.transaction.subcategory", {
        name: String(category.name),
      }),
    );
  const optionalRelations = [
    [i18n.t("validation.transaction.relations.budget"), document.budgets, draft.budgetId],
    [i18n.t("validation.transaction.relations.label"), document.labels, draft.labelId],
    [i18n.t("validation.transaction.relations.loan"), document.loans, draft.loanId],
    [i18n.t("validation.transaction.relations.place"), document.places, draft.placeId],
    [i18n.t("validation.transaction.relations.person"), document.peoples, draft.personId],
  ] as const;
  for (const [label, records, value] of optionalRelations) {
    if (!value) continue;
    const relation = findRecord(records, value);
    if (!relation || !belongsToProfile(document, relation, profileId))
      throw new Error(i18n.t("validation.transaction.relation", { label }));
  }
  return {
    account,
    amount,
    category,
    currencyCode,
    destination,
    occurredAt: occurredAt.toISOString(),
  };
}

export function transactionDraftFromRecord(
  document: BackupDocument,
  id: string,
): TransactionDraft | null {
  const record = document.transactions.find(
    (transaction) => identity(transaction) === id,
  );
  if (!record) return null;
  const tags = Array.isArray(record.tags) ? record.tags : [];
  return {
    type: transactionType(record),
    name: typeof record.name === "string" ? record.name : "",
    amount: String(record.amount ?? ""),
    description:
      typeof record.description === "string" ? record.description : "",
    occurredAt: String(record.date ?? record.createdAt ?? ""),
    accountId: String(sourceReference(record) ?? ""),
    destinationAccountId: String(destinationReference(record) ?? ""),
    categoryId: String(record.category ?? ""),
    budgetId: String(record.budget ?? ""),
    labelId: String(record.label ?? tags[0] ?? ""),
    loanId: String(record.loan ?? ""),
    placeId: String(record.place ?? ""),
    personId: String(record.person ?? record.payee ?? ""),
    receiptPath:
      typeof record.receipt === "string"
        ? record.receipt
        : typeof record.image === "string"
          ? record.image
          : null,
    receiptAttachmentId:
      typeof record.receiptAttachmentId === "string"
        ? record.receiptAttachmentId
        : null,
  };
}

export function saveTransaction(
  document: BackupDocument,
  draft: TransactionDraft,
  id: string,
  profileId: string,
  now: string,
  editing = false,
): BackupDocument {
  const existing = document.transactions.find(
    (transaction) => identity(transaction) === id,
  );
  if (!id || (editing && !existing))
    throw new Error(i18n.t("validation.transaction.missing"));
  if (existing && !editing)
    throw new Error(i18n.t("validation.transaction.alreadySaved"));
  if (existing && !belongsToProfile(document, existing, profileId))
    throw new Error(i18n.t("validation.transaction.wrongProfile"));
  const values = resolveDraft(document, draft, profileId);
  const record: JsonObject = {
    ...existing,
    uuid: existing?.uuid ?? id,
    name: draft.name.trim(),
    description: draft.description.trim(),
    amount: values.amount,
    type: draft.type,
    currencyCode: values.currencyCode,
    account: identity(values.account),
    accountName: values.account.name ?? "",
    category: values.category ? identity(values.category) : null,
    categoryName: values.category?.name ?? "",
    budget: draft.budgetId || null,
    label: draft.labelId || null,
    tags: draft.labelId ? [draft.labelId] : [],
    loan: draft.loanId || null,
    place: draft.placeId || null,
    person: draft.personId || null,
    payee: draft.personId || null,
    receipt: draft.receiptPath,
    image: draft.receiptPath,
    receiptAttachmentId: draft.receiptAttachmentId,
    fromAccount: draft.type === 2 ? identity(values.account) : null,
    toAccount:
      draft.type === 2 && values.destination
        ? identity(values.destination)
        : null,
    user: profileId,
    date: values.occurredAt,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const effects = mergeEffects(
    existing ? transactionEffect(document, existing, -1) : new Map(),
    transactionEffect(document, record, 1),
  );
  const nextAccountIds = relatedAccountIds(document, record);
  const accounts = document.accounts.map((account) => {
    const accountId = identity(account);
    const delta = effects.get(accountId) ?? 0;
    const balance = Number(account.amount);
    if (delta && (!Number.isFinite(balance) || !Number.isFinite(balance + delta)))
      throw new Error(i18n.t("validation.transaction.invalidAccountBalance"));
    return {
      ...account,
      ...(delta
        ? { amount: Math.round((balance + delta) * 1e8) / 1e8, updatedAt: now }
        : {}),
      ...(Array.isArray(account.transactions)
        ? {
            transactions: updateReferences(
              account.transactions,
              id,
              nextAccountIds.has(accountId),
            ),
          }
        : {}),
    };
  });
  const previousCategory = existing
    ? findRecord(document.categories, existing.category)
    : undefined;
  const categories = document.categories.map((category) => {
    if (!Array.isArray(category.transactions)) return category;
    const categoryId = identity(category);
    const shouldContain = values.category
      ? categoryId === identity(values.category)
      : false;
    if (
      !shouldContain &&
      (!previousCategory || categoryId !== identity(previousCategory))
    )
      return category;
    return {
      ...category,
      transactions: updateReferences(category.transactions, id, shouldContain),
      updatedAt: now,
    };
  });
  const oldAttachmentId = existing?.receiptAttachmentId;
  const attachments = document._local.attachments.filter(
    (attachment) =>
      typeof oldAttachmentId !== "string" ||
      oldAttachmentId === draft.receiptAttachmentId ||
      attachment.id !== oldAttachmentId,
  );
  return {
    ...document,
    accounts,
    categories,
    transactions: existing
      ? document.transactions.map((transaction) =>
          identity(transaction) === id ? record : transaction,
        )
      : [...document.transactions, record],
    _local: { ...document._local, attachments },
  };
}

export function deleteTransaction(
  document: BackupDocument,
  id: string,
  profileId: string,
  now: string,
): BackupDocument {
  const record = document.transactions.find(
    (transaction) => identity(transaction) === id,
  );
  if (!record) throw new Error(i18n.t("validation.transaction.missing"));
  if (!belongsToProfile(document, record, profileId))
    throw new Error(i18n.t("validation.transaction.wrongProfile"));
  const effects = transactionEffect(document, record, -1);
  const accounts = document.accounts.map((account) => {
    const delta = effects.get(identity(account)) ?? 0;
    const balance = Number(account.amount);
    if (delta && (!Number.isFinite(balance) || !Number.isFinite(balance + delta)))
      throw new Error(
        i18n.t("validation.transaction.invalidAccountBalanceShort"),
      );
    return {
      ...account,
      ...(delta
        ? { amount: Math.round((balance + delta) * 1e8) / 1e8, updatedAt: now }
        : {}),
      ...(Array.isArray(account.transactions)
        ? {
            transactions: updateReferences(
              account.transactions,
              id,
              false,
            ),
          }
        : {}),
    };
  });
  const categories = document.categories.map((category) =>
    Array.isArray(category.transactions)
      ? {
          ...category,
          transactions: updateReferences(category.transactions, id, false),
        }
      : category,
  );
  return {
    ...document,
    accounts,
    categories,
    transactions: document.transactions.filter(
      (transaction) => identity(transaction) !== id,
    ),
    _local: {
      ...document._local,
      attachments: document._local.attachments.filter(
        (attachment) => attachment.id !== record.receiptAttachmentId,
      ),
    },
  };
}

export function saveTransactionTemplate(
  document: BackupDocument,
  draft: TransactionDraft,
  id: string,
  profileId: string,
  now: string,
): BackupDocument {
  const values = resolveDraft(document, draft, profileId);
  if (document.templates.some((template) => references(template, id)))
    throw new Error(i18n.t("validation.transaction.templateAlreadySaved"));
  return {
    ...document,
    templates: [
      ...document.templates,
      {
        uuid: id,
        name: draft.name.trim(),
        description: draft.description.trim(),
        amount: values.amount,
        type: draft.type,
        account: identity(values.account),
        category: values.category ? identity(values.category) : null,
        budget: draft.budgetId || null,
        label: draft.labelId || null,
        tags: draft.labelId ? [draft.labelId] : [],
        loan: draft.loanId || null,
        place: draft.placeId || null,
        person: draft.personId || null,
        toAccount:
          draft.type === 2 && values.destination
            ? identity(values.destination)
            : null,
        user: profileId || categoryProfileId(document),
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}