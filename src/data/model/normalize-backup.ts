import {
  BACKUP_COLLECTION_KEYS,
  BACKUP_VERSION,
  LOCAL_SCHEMA_VERSION,
  type AttachmentManifest,
  type BackupDocument,
} from "./backup-document";
import { isJsonObject } from "./json";
import { normalizeAccountRecord } from "./account-record";
import { RATE_SOURCE } from "./exchange-rate";

function normalizeAttachments(value: unknown): AttachmentManifest[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is AttachmentManifest =>
      isJsonObject(item) &&
      typeof item.id === "string" &&
      typeof item.fileName === "string" &&
      typeof item.mimeType === "string" &&
      typeof item.relativePath === "string" &&
      typeof item.size === "number",
  );
}

export function normalizeBackupDocument(value: unknown): BackupDocument {
  if (!isJsonObject(value)) {
    throw new Error("Backup must contain a JSON object at its root.");
  }

  const document = { ...value } as unknown as BackupDocument;
  const version = value.backupVersion;
  if (typeof version === "number" && version > BACKUP_VERSION) {
    throw new Error(
      `Backup version ${version} is newer than supported version ${BACKUP_VERSION}.`,
    );
  }
  document.backupVersion =
    typeof version === "number" && Number.isFinite(version)
      ? version
      : BACKUP_VERSION;

  for (const key of BACKUP_COLLECTION_KEYS) {
    const collection = value[key];
    document[key] = Array.isArray(collection)
      ? collection.filter(isJsonObject)
      : [];
  }

  const local = isJsonObject(value._local) ? value._local : {};
  if (
    typeof local.schemaVersion === "number" &&
    local.schemaVersion > LOCAL_SCHEMA_VERSION
  ) {
    throw new Error(
      "This backup uses a newer local schema. Update the app before restoring it.",
    );
  }
  document.accounts = document.accounts.map(normalizeAccountRecord);
  // Leave foreign/imported rate formats intact. Selectors validate our tables
  // before use; missing freshness metadata must never imply a current rate.
  document.exchangeRates = document.exchangeRates.map((record) =>
    record.source === RATE_SOURCE ? { fetchedAt: null, ...record } : record,
  );
  document._local = {
    ...local,
    schemaVersion: LOCAL_SCHEMA_VERSION,
    exportedAt: typeof local.exportedAt === "string" ? local.exportedAt : null,
    selectedProfileId:
      typeof local.selectedProfileId === "string"
        ? local.selectedProfileId
        : null,
    attachments: normalizeAttachments(local.attachments),
    cloudProvider: null,
  };

  return document;
}

export function parseBackupDocument(json: string): BackupDocument {
  try {
    return normalizeBackupDocument(JSON.parse(json));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("The selected file is not valid JSON.");
    }
    throw error;
  }
}

export function cloneBackupDocument(document: BackupDocument) {
  return JSON.parse(JSON.stringify(document)) as BackupDocument;
}
