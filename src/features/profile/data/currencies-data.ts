export type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
};

export const currencies: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
];
