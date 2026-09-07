import { strToU8, zipSync } from "fflate";

import { getAttachmentFile } from "../attachments/attachment-store";
import type { BackupDocument } from "../model/backup-document";
import { createFullBackupDocument } from "./document-export";

export { parseZipBackup } from "./zip-codec";

export async function createZipBackup(document: BackupDocument) {
  const exported = createFullBackupDocument(document);
  const files: Record<string, Uint8Array> = {
    "backup.json": strToU8(JSON.stringify(exported, null, 2)),
  };

  for (const attachment of exported._local.attachments) {
    const file = getAttachmentFile(attachment.relativePath);
    if (!file.exists) {
      throw new Error(
        `Attachment ${attachment.fileName} is missing from local storage.`,
      );
    }
    files[`attachments/${attachment.relativePath}`] = await file.bytes();
  }

  return zipSync(files, { level: 6 });
}
