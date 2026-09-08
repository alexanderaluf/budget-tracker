import { BottomSheet, Button } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalData } from "@/data/local-data-provider";
import { convertCurrency, type ExchangeRateSnapshot } from "@/data/model/exchange-rate";
import { selectExchangeRates } from "@/data/selectors/exchange-rate-selectors";

export type CurrencyChangeRequest = { from: string; to: string; amount: number };

export function AccountCurrencyChangeSheet({ request, onClose, onApply }: {
  request: CurrencyChangeRequest | null;
  onClose: () => void;
  onApply: (amount: number, explanation: string) => void;
}) {
  const { document, ensureExchangeRates } = useLocalData();
  const insets = useSafeAreaInsets();
  const [snapshot, setSnapshot] = useState<ExchangeRateSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cached, setCached] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current += 1;
    setSnapshot(null);
    setLoading(false);
    setError("");
    setCached(false);
    return () => { generation.current += 1; };
  }, [request]);

  async function loadRate() {
    if (!request || loading) return;
    const current = generation.current;
    setLoading(true);
    setError("");
    try {
      const next = await ensureExchangeRates(request.from);
      if (current !== generation.current) return;
      if (!next.rates[request.to]) throw new Error(`No exchange rate is available for ${request.to}.`);
      setSnapshot(next);
      setCached(false);
    } catch (reason) {
      if (current !== generation.current) return;
      const saved = selectExchangeRates(document, request.from);
      if (saved?.rates[request.to]) {
        setSnapshot(saved);
        setCached(true);
        setError("Could not refresh rates. You can explicitly use the saved rate below, or keep the number unchanged.");
      } else {
        setError(reason instanceof Error ? reason.message : "Unable to load exchange rates.");
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }

  const rate = request ? snapshot?.rates[request.to] : undefined;
  let converted: number | null = null;
  let conversionError = "";
  if (request && rate) {
    try { converted = convertCurrency(request.amount, rate, request.to); }
    catch (reason) { conversionError = reason instanceof Error ? reason.message : "Unable to convert this amount."; }
  }
  const oldRate = snapshot && snapshot.date !== new Date().toISOString().slice(0, 10);

  return (
    <BottomSheet isOpen={request !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
        <BottomSheet.Overlay />
        <BottomSheet.Content topInset={insets.top} backgroundClassName="rounded-t-[28px] bg-surface"
          handleIndicatorClassName="w-10 bg-muted/40" contentContainerClassName="px-5 pt-2">
          {request && <View className="gap-4" style={{ paddingBottom: insets.bottom + 16 }}>
            <BottomSheet.Title>Change account currency?</BottomSheet.Title>
            <BottomSheet.Description>
              {request.amount} {request.from} → {request.to}. Keep the balance number or convert its value. Changes are applied when you save the account.
            </BottomSheet.Description>
            <Button variant="secondary" onPress={() => onApply(request.amount,
              `Kept ${request.amount} unchanged: ${request.from} → ${request.to}.`)}>
              <Button.Label>Keep {request.amount} {request.to}</Button.Label>
            </Button>
            {!!(error || conversionError) && <Text accessibilityRole="alert" className="text-danger">{error || conversionError}</Text>}
            {snapshot && rate && converted !== null && <View className="gap-2 rounded-2xl bg-surface-secondary p-4">
              <Text className="font-manrope-bold text-lg text-foreground">{converted} {request.to}</Text>
              <Text className="text-sm text-muted">1 {request.from} = {rate} {request.to} · Rate date: {snapshot.date}</Text>
              {(cached || oldRate) && <Text className="text-sm text-muted">This rate is {cached ? "saved on your device" : "the latest available"}{oldRate ? ", not today's rate" : ""}.</Text>}
              <Button onPress={() => onApply(converted!,
                `Converted ${request.amount} ${request.from} to ${converted} ${request.to} at ${rate} (rate date ${snapshot.date}).`)}>
                <Button.Label>{cached || oldRate ? "Use this dated rate" : "Apply conversion"}</Button.Label>
              </Button>
            </View>}
            <Button variant={snapshot ? "tertiary" : "primary"} isDisabled={loading} onPress={loadRate}>
              <Button.Label>{loading ? "Loading daily rate…" : snapshot ? "Refresh rate" : "Preview daily conversion"}</Button.Label>
            </Button>
            <Button variant="ghost" onPress={onClose}><Button.Label>Cancel currency change</Button.Label></Button>
          </View>}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
