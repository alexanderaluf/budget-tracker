import type { BackupDocument } from "../model/backup-document";
import { readRateSnapshot, type ExchangeRateSnapshot } from "../model/exchange-rate";

export function selectExchangeRates(document: BackupDocument, base: string) {
  return document.exchangeRates.map(readRateSnapshot)
    .filter((record): record is ExchangeRateSnapshot => record !== null && record.base === base.toUpperCase())
    .sort((a, b) => b.date.localeCompare(a.date) || b.fetchedAt.localeCompare(a.fetchedAt))[0] ?? null;
}

export function selectExchangeQuote(document: BackupDocument, base: string, target: string, now = new Date(), requireDaily = false) {
  const snapshot = selectExchangeRates(document, base);
  const today = now.toISOString().slice(0, 10);
  if (!snapshot || snapshot.date > today ||
    (requireDaily && snapshot.date !== today)) return null;
  const rate = snapshot.rates[target.toUpperCase()];
  return rate ? { rate, date: snapshot.date, base: snapshot.base, target: target.toUpperCase() } : null;
}
