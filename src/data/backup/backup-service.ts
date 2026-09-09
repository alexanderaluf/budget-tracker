import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { i18n } from "@/localization/i18n";

import type { ArchivedAttachment } from "../attachments/attachment-store";
import type { BackupDocument } from "../model/backup-document";
import { parseBackupDocument } from "../model/normalize-backup";
import { transactionsFromCsv, transactionsToCsv } from "./csv-backup";
import { createJsonBackupDocument } from "./document-export";
import { createZipBackup, parseZipBackup } from "./zip-backup";

export type BackupFormat = "zip" | "json" | "csv";
const MAX_IMPORT_BYTES = 128 * 1024 * 1024;

export type ImportedBackup = {
  format: BackupFormat;
  document: BackupDocument;
  attachments?: ArchivedAttachment[];
};

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function createExportFile(name: string, content: string | Uint8Array) {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true, intermediates: true });
  file.write(content);
  return file;
}

async function shareFile(file: File, mimeType: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error(i18n.t("errors.backup.sharingUnavailable"));
  }

  await Sharing.shareAsync(file.uri, {
    dialogTitle: "Export Plutus data",
    mimeType,
  });
}

export async function exportBackup(
  document: BackupDocument,
  format: BackupFormat,
) {
  const suffix = timestamp();

  if (format === "json") {
    const file = createExportFile(
      `plutus-${suffix}.json`,
      JSON.stringify(createJsonBackupDocument(document), null, 2),
    );
    await shareFile(file, "application/json");
    return file.uri;
  }

  if (format === "csv") {
    const file = createExportFile(
      `plutus-transactions-${suffix}.csv`,
      transactionsToCsv(document.transactions),
    );
    await shareFile(file, "text/csv");
    return file.uri;
  }

  const file = createExportFile(
    `plutus-full-${suffix}.zip`,
    await createZipBackup(document),
  );
  await shareFile(file, "application/zip");
  return file.uri;
}

function mergeTransactions(
  current: BackupDocument,
  incoming: BackupDocument["transactions"],
) {
  const merged = new Map<string, BackupDocument["transactions"][number]>();
  current.transactions.forEach((item, index) => {
    merged.set(String(item.uuid ?? item.id ?? `existing-${index}`), item);
  });
  incoming.forEach((item, index) => {
    merged.set(String(item.uuid ?? item.id ?? `imported-${index}`), item);
  });
  return { ...current, transactions: [...merged.values()] };
}

export async function pickAndImportBackup(current: BackupDocument) {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ["application/json", "text/csv", "application/zip", "*/*"],
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  const file = new File(asset.uri);
  const fileSize = asset.size ?? file.size;
  if (fileSize > MAX_IMPORT_BYTES) {
    throw new Error(i18n.t("errors.backup.importTooLarge"));
  }
  const extension = asset.name.toLowerCase().split(".").pop();

  if (extension === "zip") {
    const restored = parseZipBackup(await file.bytes());
    return {
      format: "zip" as const,
      document: restored.document,
      attachments: restored.attachments,
    } satisfies ImportedBackup;
  }

  if (extension === "csv") {
    return {
      format: "csv" as const,
      document: mergeTransactions(
        current,
        transactionsFromCsv(await file.text()),
      ),
    } satisfies ImportedBackup;
  }

  return {
    format: "json" as const,
    document: parseBackupDocument(await file.text()),
  } satisfies ImportedBackup;
}
