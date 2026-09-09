const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function formatCurrency(value: number, currency = "USD") {
  return currency === "USD"
    ? currencyFormatter.format(Math.abs(value))
    : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
        Math.abs(value),
      );
}

export function formatSignedCurrency(value: number, currency = "USD") {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${formatCurrency(value, currency)}`;
}
