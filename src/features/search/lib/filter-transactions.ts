import type { SearchResult } from "../types";

export function filterTransactions(
  transactions: SearchResult[],
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) return transactions;

  return transactions.filter((transaction) =>
    [transaction.title, transaction.category, transaction.account].some(
      (value) => value.toLocaleLowerCase().includes(normalizedQuery),
    ),
  );
}
