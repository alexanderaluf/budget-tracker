import { getAttachmentFile } from "@/data/attachments/attachment-store";
import type { JsonObject, JsonValue } from "@/data/model/json";

import type { UserProfile } from "../types";
import { getProfileColor, getProfileInitials } from "./profile-utils";

function text(value: JsonValue | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function resolveImage(value: JsonValue | undefined) {
  if (typeof value !== "string" || !value) return undefined;
  if (value.includes("://")) return value;

  try {
    return getAttachmentFile(value).uri;
  } catch {
    return undefined;
  }
}

export function profileFromRecord(
  record: JsonObject,
  index: number,
): UserProfile {
  const name = text(record.name, `Profile ${index + 1}`);
  const id = text(record.uuid, String(record.id ?? `profile-${index}`));

  return {
    id,
    name,
    email: text(record.email, `${id}@local.profile`),
    initials: text(record.initials, getProfileInitials(name)),
    color: text(record.color, getProfileColor(index)),
    role: text(record.role, "Personal"),
    imageUri: resolveImage(record.image),
    currencyCode: text(record.currency, "USD"),
    currencyName: text(record.currencyName, "US Dollar"),
    currencySymbol: text(record.currencySymbol, "$"),
  };
}
