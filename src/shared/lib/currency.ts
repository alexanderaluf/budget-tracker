const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(Math.abs(value));
}

export function formatSignedCurrency(value: number) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${formatCurrency(value)}`;
}
