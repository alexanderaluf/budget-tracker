import type { SQLiteDatabase } from "expo-sqlite";

import type { BackupDocument } from "../model/backup-document";
import { createDefaultBackup } from "../model/default-backup";
import { normalizeBackupDocument } from "../model/normalize-backup";

type DocumentRow = {
  document_json: string;
};

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
