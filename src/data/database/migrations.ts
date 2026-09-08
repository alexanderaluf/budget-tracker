import type { SQLiteDatabase } from "expo-sqlite";

import { DEFAULT_CATEGORIES_REVISION } from "../model/backup-document";
import { createDefaultBackup } from "../model/default-backup";
import type { JsonValue } from "../model/json";
import { normalizeBackupDocument } from "../model/normalize-backup";

const DATABASE_VERSION = 11;
// Superseded default category uuids from the pre-v9 seed (Groceries/Housing/Dining/Coffee/Income/Savings goals).
const LEGACY_DEFAULT_CATEGORY_UUIDS = new Set([
  "category-groceries",
  "category-housing",
  "category-dining",
  "category-coffee",
  "category-income",
  "category-goals",
]);
const LEGACY_CATEGORY_RENAMES: Record<string, string> = {
  "category-income": "category-salary",
  "category-dining": "category-food",
  "category-coffee": "category-food",
};
// The v9 default set, still including the since-removed Project Aurora category.
const V9_DEFAULT_CATEGORY_UUIDS = new Set([
  "category-groceries",
  "category-bills",
  "category-rent",
  "category-travel",
  "category-food",
  "category-car",
  "category-shopping",
  "category-entertainment",
  "category-health",
  "category-education",
  "category-utilities",
  "category-housing",
  "category-others",
  "category-business",
  "category-investments",
  "category-savings",
  "category-salary",
  "category-project-aurora",
  "category-gifts",
]);
const ALL_SUPERSEDED_DEFAULT_CATEGORY_UUIDS = new Set([
  ...LEGACY_DEFAULT_CATEGORY_UUIDS,
  ...V9_DEFAULT_CATEGORY_UUIDS,
]);

export async function migrateLocalDatabase(database: SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS app_document (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      schema_version INTEGER NOT NULL,
      document_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM app_document WHERE id = 1",
  );

  if (!row?.count) {
    const document = createDefaultBackup();
    await database.runAsync(
      `INSERT INTO app_document (id, schema_version, document_json, updated_at)
       VALUES (1, ?, ?, ?)`,
      document._local.schemaVersion,
      JSON.stringify(document),
      new Date().toISOString(),
    );
  }

  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 2 && row?.count) {
    const stored = await database.getFirstAsync<{ document_json: string }>(
      "SELECT document_json FROM app_document WHERE id = 1",
    );
    if (stored) {
      const document = normalizeBackupDocument(
        JSON.parse(stored.document_json),
      );
      const isOriginalSeed = document.users.some(
        (user) => user.uuid === "alex-personal",
      );
      if (isOriginalSeed && document.budgets.length === 0) {
        const defaults = createDefaultBackup();
        document.budgets = defaults.budgets;
        document.categories = defaults.categories;
        document.transactions = defaults.transactions;
        document._local.schemaVersion = defaults._local.schemaVersion;
        await database.runAsync(
          `UPDATE app_document
           SET schema_version = ?, document_json = ?, updated_at = ?
           WHERE id = 1`,
          document._local.schemaVersion,
          JSON.stringify(document),
          new Date().toISOString(),
        );
      }
    }
  }

  if (currentVersion < 3) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const stored = await transaction.getFirstAsync<{ document_json: string }>(
        "SELECT document_json FROM app_document WHERE id = 1",
      );
      if (stored) {
        const document = normalizeBackupDocument(
          JSON.parse(stored.document_json),
        );
        await transaction.runAsync(
          "UPDATE app_document SET schema_version = ?, document_json = ?, updated_at = ? WHERE id = 1",
          document._local.schemaVersion,
          JSON.stringify(document),
          new Date().toISOString(),
        );
      }
      await transaction.execAsync("PRAGMA user_version = 3;");
    });
  }

  if (currentVersion < 4) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const stored = await transaction.getFirstAsync<{ document_json: string }>(
        "SELECT document_json FROM app_document WHERE id = 1",
      );
      if (stored) {
        const document = normalizeBackupDocument(
          JSON.parse(stored.document_json),
        );
        await transaction.runAsync(
          "UPDATE app_document SET schema_version = ?, document_json = ?, updated_at = ? WHERE id = 1",
          document._local.schemaVersion,
          JSON.stringify(document),
          new Date().toISOString(),
        );
      }
      await transaction.execAsync("PRAGMA user_version = 4;");
    });
  }

  if (currentVersion < 5) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const stored = await transaction.getFirstAsync<{ document_json: string }>(
        "SELECT document_json FROM app_document WHERE id = 1",
      );
      if (stored) {
        const document = normalizeBackupDocument(
          JSON.parse(stored.document_json),
        );
        const isOriginalSeed = document.users.some(
          (user) => user.uuid === "alex-personal",
        );
        if (isOriginalSeed) {
          const bank = document.accounts.find(
            (account) =>
              account.uuid === "account-checking" &&
              account.name === "Everyday checking" &&
              account.bankName === "Northstar Bank",
          );
          if (bank && bank.cardCompany == null && bank.cardLastFour == null) {
            bank.accountType = "bank";
            bank.type = 3;
          }
          const card = document.accounts.find(
            (account) =>
              account.uuid === "account-credit" &&
              account.name === "Everyday rewards",
          );
          if (card && card.cardCompany === "Mastercard") {
            card.linkedBankAccountId ??= "account-checking";
            card.paymentDay ??= 10;
          }
        }
        await transaction.runAsync(
          "UPDATE app_document SET schema_version = ?, document_json = ?, updated_at = ? WHERE id = 1",
          document._local.schemaVersion,
          JSON.stringify(document),
          new Date().toISOString(),
        );
      }
      await transaction.execAsync("PRAGMA user_version = 5;");
    });
  }

  if (currentVersion < 6) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const stored = await transaction.getFirstAsync<{ document_json: string }>(
        "SELECT document_json FROM app_document WHERE id = 1",
      );
      if (stored) {
        const document = normalizeBackupDocument(
          JSON.parse(stored.document_json),
        );
        await transaction.runAsync(
          "UPDATE app_document SET schema_version = ?, document_json = ?, updated_at = ? WHERE id = 1",
          document._local.schemaVersion,
          JSON.stringify(document),
          new Date().toISOString(),
        );
      }
      await transaction.execAsync("PRAGMA user_version = 6;");
    });
  }

  if (currentVersion < 7) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const stored = await transaction.getFirstAsync<{ document_json: string }>(
        "SELECT document_json FROM app_document WHERE id = 1",
      );
      if (stored) {
        const document = normalizeBackupDocument(
          JSON.parse(stored.document_json),
        );
        await transaction.runAsync(
          "UPDATE app_document SET schema_version = ?, document_json = ?, updated_at = ? WHERE id = 1",
          document._local.schemaVersion,
          JSON.stringify(document),
          new Date().toISOString(),
        );
      }
      await transaction.execAsync("PRAGMA user_version = 7;");
    });
  }

  if (currentVersion < 8) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const stored = await transaction.getFirstAsync<{ document_json: string }>(
        "SELECT document_json FROM app_document WHERE id = 1",
      );
      if (stored) {
        const document = normalizeBackupDocument(
          JSON.parse(stored.document_json),
        );
        await transaction.runAsync(
          "UPDATE app_document SET schema_version = ?, document_json = ?, updated_at = ? WHERE id = 1",
          document._local.schemaVersion,
          JSON.stringify(document),
          new Date().toISOString(),
        );
      }
      await transaction.execAsync("PRAGMA user_version = 8;");
    });
  }

  if (currentVersion < 9) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const stored = await transaction.getFirstAsync<{ document_json: string }>(
        "SELECT document_json FROM app_document WHERE id = 1",
      );
      if (stored) {
        const document = normalizeBackupDocument(
          JSON.parse(stored.document_json),
        );
        const isOriginalSeed = document.users.some(
          (user) => user.uuid === "alex-personal",
        );
        const isUntouchedLegacySeed =
          document.categories.length > 0 &&
          document.categories.every(
            (category) =>
              typeof category.uuid === "string" &&
              LEGACY_DEFAULT_CATEGORY_UUIDS.has(category.uuid),
          );
        if (isOriginalSeed && isUntouchedLegacySeed) {
          const defaults = createDefaultBackup();
          document.categories = defaults.categories;
          document.budgets = defaults.budgets;
          const renameCategory = (uuid: JsonValue): JsonValue =>
            typeof uuid === "string" && LEGACY_CATEGORY_RENAMES[uuid]
              ? LEGACY_CATEGORY_RENAMES[uuid]
              : uuid;
          document.transactions = document.transactions.map((record) => {
            const category = renameCategory(record.category);
            const renamed = defaults.categories.find(
              (candidate) => candidate.uuid === category,
            );
            return renamed
              ? { ...record, category, categoryName: renamed.name }
              : record;
          });
        }
        await transaction.runAsync(
          "UPDATE app_document SET schema_version = ?, document_json = ?, updated_at = ? WHERE id = 1",
          document._local.schemaVersion,
          JSON.stringify(document),
          new Date().toISOString(),
        );
      }
      await transaction.execAsync("PRAGMA user_version = 9;");
    });
  }

  if (currentVersion < 10) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const stored = await transaction.getFirstAsync<{ document_json: string }>(
        "SELECT document_json FROM app_document WHERE id = 1",
      );
      if (stored) {
        const document = normalizeBackupDocument(
          JSON.parse(stored.document_json),
        );
        const isOriginalSeed = document.users.some(
          (user) => user.uuid === "alex-personal",
        );
        const isUntouchedV9Seed =
          document.categories.length > 0 &&
          document.categories.every(
            (category) =>
              typeof category.uuid === "string" &&
              V9_DEFAULT_CATEGORY_UUIDS.has(category.uuid),
          );
        if (isOriginalSeed && isUntouchedV9Seed) {
          const defaults = createDefaultBackup();
          document.categories = defaults.categories;
          document.budgets = defaults.budgets;
          document.transactions = document.transactions.map((record) =>
            record.category === "category-project-aurora"
              ? {
                  ...record,
                  category: "category-others",
                  categoryName: "Others",
                }
              : record,
          );
        }
        await transaction.runAsync(
          "UPDATE app_document SET schema_version = ?, document_json = ?, updated_at = ? WHERE id = 1",
          document._local.schemaVersion,
          JSON.stringify(document),
          new Date().toISOString(),
        );
      }
      await transaction.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    });
  }

  if (currentVersion < 11) {
    await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  }

  // This revision is independent of PRAGMA user_version so partially migrated devices recover.
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const stored = await transaction.getFirstAsync<{ document_json: string }>(
      "SELECT document_json FROM app_document WHERE id = 1",
    );
    if (!stored) return;
    const document = normalizeBackupDocument(JSON.parse(stored.document_json));
    const isOriginalSeed = document.users.some(
      (user) => user.uuid === "alex-personal",
    );
    if (
      !isOriginalSeed ||
      document._local.defaultCategoriesRevision >= DEFAULT_CATEGORIES_REVISION
    )
      return;
    const defaults = createDefaultBackup();
    const customCategories = document.categories.filter(
      (category) =>
        typeof category.uuid !== "string" ||
        !ALL_SUPERSEDED_DEFAULT_CATEGORY_UUIDS.has(category.uuid),
    );
    document.categories = [...defaults.categories, ...customCategories];
    document.transactions = document.transactions.map((record) => {
      const legacyRename =
        typeof record.category === "string"
          ? LEGACY_CATEGORY_RENAMES[record.category]
          : undefined;
      const category =
        legacyRename ??
        (record.category === "category-project-aurora"
          ? "category-others"
          : record.category);
      const renamed = defaults.categories.find(
        (candidate) => candidate.uuid === category,
      );
      return renamed
        ? { ...record, category, categoryName: renamed.name }
        : record;
    });
    document._local.defaultCategoriesRevision = DEFAULT_CATEGORIES_REVISION;
    await transaction.runAsync(
      "UPDATE app_document SET schema_version = ?, document_json = ?, updated_at = ? WHERE id = 1",
      document._local.schemaVersion,
      JSON.stringify(document),
      new Date().toISOString(),
    );
  });
}
