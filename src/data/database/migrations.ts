import type { SQLiteDatabase } from "expo-sqlite";

import { createDefaultBackup } from "../model/default-backup";
import { normalizeBackupDocument } from "../model/normalize-backup";

const DATABASE_VERSION = 8;

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
        const document = normalizeBackupDocument(JSON.parse(stored.document_json));
        await transaction.runAsync(
          "UPDATE app_document SET schema_version = ?, document_json = ?, updated_at = ? WHERE id = 1",
          document._local.schemaVersion, JSON.stringify(document), new Date().toISOString(),
        );
      }
      await transaction.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    });
  }
}
