import type { SQLiteDatabase } from "expo-sqlite";

import type { BackupDocument } from "../model/backup-document";
import { createDefaultBackup } from "../model/default-backup";
import { normalizeBackupDocument } from "../model/normalize-backup";

type DocumentRow = {
  document_json: string;
};

/** Read and mutate under the same SQL lock, including headless task writes. */
export async function mutateDocument(
  database: SQLiteDatabase,
  updater: (current: BackupDocument) => BackupDocument,
) {
  let committed: BackupDocument | undefined;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const current = await readDocument(transaction);
    const next = normalizeBackupDocument(updater(current));
    await transaction.runAsync(
      `INSERT INTO app_document (id, schema_version, document_json, updated_at) VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET schema_version = excluded.schema_version,
       document_json = excluded.document_json, updated_at = excluded.updated_at`,
      next._local.schemaVersion,
      JSON.stringify(next),
      new Date().toISOString(),
    );
    committed = next;
  });
  return committed!;
}

export async function readDocument(database: SQLiteDatabase) {
  const row = await database.getFirstAsync<DocumentRow>(
    "SELECT document_json FROM app_document WHERE id = 1",
  );

  if (!row) return createDefaultBackup();
  return normalizeBackupDocument(JSON.parse(row.document_json));
}

export async function writeDocument(
  database: SQLiteDatabase,
  document: BackupDocument,
) {
  const normalized = normalizeBackupDocument(document);

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      `INSERT INTO app_document (id, schema_version, document_json, updated_at)
       VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         schema_version = excluded.schema_version,
         document_json = excluded.document_json,
         updated_at = excluded.updated_at`,
      normalized._local.schemaVersion,
      JSON.stringify(normalized),
      new Date().toISOString(),
    );
  });
}
