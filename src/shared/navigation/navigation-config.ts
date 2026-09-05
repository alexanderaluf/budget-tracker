import {
    ChartNoAxesCombined,
    CreditCard,
    House,
    Search,
} from "lucide-react-native";

import type { TabId, TabItem } from "./types";

export const navigationItems: TabItem[] = [
  { id: "home", label: "Home", href: "/", icon: House },
  { id: "accounts", label: "Accounts", href: "/accounts", icon: CreditCard },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    icon: ChartNoAxesCombined,
  },
  { id: "search", label: "Search", href: "/search", icon: Search },
];

export function getTabFromPathname(pathname: string): TabId {
  if (pathname.startsWith("/accounts")) return "accounts";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/search")) return "search";
  return "home";
}
