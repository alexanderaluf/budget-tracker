import type { FilledIconName } from "@/shared/ui/filled-icon";

export type TabId = "home" | "accounts" | "reports" | "search";
export type TabHref = "/" | "/accounts" | "/reports" | "/search";

export type TabItem = {
  id: TabId;
  label: string;
  href: TabHref;
  icon: FilledIconName;
};
