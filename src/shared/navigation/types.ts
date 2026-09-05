import type { LucideIcon } from "lucide-react-native";

export type TabId = "home" | "accounts" | "reports" | "search";
export type TabHref = "/" | "/accounts" | "/reports" | "/search";

export type TabItem = {
  id: TabId;
  label: string;
  href: TabHref;
  icon: LucideIcon;
};
