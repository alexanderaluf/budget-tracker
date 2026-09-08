import type { JsonObject, JsonValue } from "./json";

export const BACKUP_VERSION = 3;
export const LOCAL_SCHEMA_VERSION = 12;
export const DEFAULT_CATEGORIES_REVISION = 1;

export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const ACCENT_COLOR_IDS = [
  "cyan",
  "blue",
  "violet",
  "rose",
  "coral",
  "amber",
  "green",
  "lime",
] as const;
export type AccentColorId = (typeof ACCENT_COLOR_IDS)[number];
export const DEFAULT_ACCENT_COLOR: AccentColorId = "cyan";

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
  defaultCategoriesRevision: number;
  exportedAt: string | null;
  selectedProfileId: string | null;
  themeMode: ThemeMode;
  accentColor: AccentColorId;
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
