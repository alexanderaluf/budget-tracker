import { strFromU8, unzipSync } from "fflate";

import type { ArchivedAttachment } from "../attachments/attachment-store";
import { parseBackupDocument } from "../model/normalize-backup";

const MAX_ARCHIVE_BYTES = 128 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 512 * 1024 * 1024;
const MAX_SINGLE_FILE_BYTES = 100 * 1024 * 1024;
const MAX_ARCHIVE_FILES = 5000;

export function parseZipBackup(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_ARCHIVE_BYTES) {
    throw new Error("Backup ZIP is too large to restore on this device.");
  }

  let archiveFileCount = 0;
  let uncompressedSize = 0;
  let validationError: Error | null = null;
  const files = unzipSync(bytes, {
    filter: (file) => {
      archiveFileCount += 1;
      uncompressedSize += file.originalSize;

      if (archiveFileCount > MAX_ARCHIVE_FILES) {
        validationError = new Error("Backup ZIP contains too many files.");
      } else if (file.originalSize > MAX_SINGLE_FILE_BYTES) {
        validationError = new Error("Backup ZIP contains an oversized file.");
      } else if (uncompressedSize > MAX_UNCOMPRESSED_BYTES) {
        validationError = new Error(
          "Backup ZIP expands beyond the restore limit.",
        );
      }

      return validationError === null;
    },
  });

  if (validationError) throw validationError;

  const backupFile = files["backup.json"];
  if (!backupFile) {
    throw new Error("Backup ZIP does not contain backup.json.");
  }

  const document = parseBackupDocument(strFromU8(backupFile));
  const attachments: ArchivedAttachment[] = [];

  for (const [path, data] of Object.entries(files)) {
    if (!path.startsWith("attachments/") || path.endsWith("/")) continue;
    const relativePath = path.slice("attachments/".length);
    if (
      !relativePath ||
      relativePath.includes("..") ||
      relativePath.startsWith("/") ||
      relativePath.includes("\\")
    ) {
      throw new Error("Backup ZIP contains an unsafe attachment path.");
    }
    attachments.push({ relativePath, data });
  }

  const restoredPaths = new Set(attachments.map((item) => item.relativePath));
  const missingAttachment = document._local.attachments.find(
    (item) => !restoredPaths.has(item.relativePath),
  );
  if (missingAttachment) {
    throw new Error(
      `Backup ZIP is missing attachment ${missingAttachment.fileName}.`,
    );
  }

  return { document, attachments };
}
