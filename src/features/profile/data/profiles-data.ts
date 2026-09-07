import type { UserProfile } from "../types";

export const initialProfiles: UserProfile[] = [
  {
    id: "alex-personal",
    name: "Alex Morgan",
    email: "alex@example.com",
    initials: "AM",
    color: "#70d2eb",
    role: "Personal",
    currencyCode: "USD",
    currencyName: "US Dollar",
    currencySymbol: "$",
  },
  {
    id: "alex-household",
    name: "Morgan Household",
    email: "household@example.com",
    initials: "MH",
    color: "#b89cf5",
    role: "Shared budget",
    currencyCode: "ILS",
    currencyName: "Israeli New Shekel",
    currencySymbol: "₪",
  },
];
