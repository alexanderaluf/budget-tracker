import type { JsonObject, JsonValue } from "./json";

export const BACKUP_VERSION = 3;
export const LOCAL_SCHEMA_VERSION = 4;

export const BACKUP_COLLECTION_KEYS = [
  "transactions",
  "accounts",
  "assets",
  "budgets",
  "billSplitters",
  "billParticipants",
  "categories",
  "goals",
  "loans",
  "recurrings",
  "labels",
  "places",
  "peoples",
  "users",
  "images",
  "templates",
  "achievements",
  "exchangeRates",
] as const;

export type BackupCollectionKey = (typeof BACKUP_COLLECTION_KEYS)[number];

export interface AttachmentManifest extends JsonObject {
  id: string;
  fileName: string;
  mimeType: string;
  relativePath: string;
  size: number;
}

export interface LocalBackupMetadata extends JsonObject {
  schemaVersion: number;
  exportedAt: string | null;
  selectedProfileId: string | null;
  attachments: AttachmentManifest[];
  cloudProvider: null;
}

export interface BackupDocument extends JsonObject {
  backupVersion: number;
  transactions: JsonObject[];
  accounts: JsonObject[];
  assets: JsonObject[];
  budgets: JsonObject[];
  billSplitters: JsonObject[];
  billParticipants: JsonObject[];
  categories: JsonObject[];
  goals: JsonObject[];
  loans: JsonObject[];
  recurrings: JsonObject[];
  labels: JsonObject[];
  places: JsonObject[];
  peoples: JsonObject[];
  users: JsonObject[];
  images: JsonObject[];
  templates: JsonObject[];
  achievements: JsonObject[];
  exchangeRates: JsonObject[];
  _local: LocalBackupMetadata;
  [key: string]: JsonValue;
}
