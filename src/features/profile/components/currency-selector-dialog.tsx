import { Dialog } from "heroui-native";
import { Pressable, Text, View } from "react-native";

import { FilledIcon } from "@/shared/ui/filled-icon";

import type { CurrencyOption } from "../data/currencies-data";

type CurrencySelectorDialogProps = {
  currencies: CurrencyOption[];
  isOpen: boolean;
  selectedCode: string;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (currency: CurrencyOption) => void;
};

export function CurrencySelectorDialog({
  currencies,
  isOpen,
  selectedCode,
  onOpenChange,
  onSelect,
}: CurrencySelectorDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="gap-4 border border-border bg-overlay">
          <Dialog.Close variant="ghost">
            <FilledIcon name="close" size={19} />
          </Dialog.Close>
          <View className="gap-1 pr-8">
            <Dialog.Title className="font-manrope-bold">
              Select currency
            </Dialog.Title>
            <Dialog.Description>
              Choose the default currency for this profile.
            </Dialog.Description>
          </View>

          <View className="overflow-hidden rounded-xl border border-border">
            {currencies.map((currency, index) => {
              const isSelected = currency.code === selectedCode;

              return (
                <Pressable
                  key={currency.code}
                  className={`flex-row items-center bg-surface-secondary px-4 py-3 ${
                    index < currencies.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                  onPress={() => onSelect(currency)}
                >
                  <View className="size-9 items-center justify-center rounded-full bg-accent">
                    <Text className="font-manrope-bold text-base text-accent-foreground">
                      {currency.symbol}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-manrope-semibold text-sm text-foreground">
                      {currency.name}
                    </Text>
                    <Text className="font-sans text-xs text-muted">
                      {currency.code}
                    </Text>
                  </View>
                  {isSelected ? (
                    <FilledIcon name="check" size={20} tone="accent" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
