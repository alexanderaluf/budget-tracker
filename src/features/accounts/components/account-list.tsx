import { Card, Chip } from "heroui-native";
import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { formatCurrency } from "@/shared/lib/currency";

import type { Account } from "../types";

type AccountListProps = {
  accounts: Account[];
  onAccountPress: (account: Account) => void;
};

export function AccountList({ accounts, onAccountPress }: AccountListProps) {
  return (
    <Card className="border border-border bg-surface p-0">
      <Card.Header className="px-5 pb-2 pt-5">
        <Card.Title className="font-manrope-bold text-lg text-foreground">
          Your accounts
        </Card.Title>
        <Card.Description className="mt-1 font-sans text-muted">
          Connected balances update automatically
        </Card.Description>
      </Card.Header>

      <Card.Body className="px-5 pb-3">
        {accounts.map((account, index) => {
          const Icon = account.icon;

          return (
            <Pressable
              key={account.id}
              accessibilityRole="button"
              className={`flex-row items-center py-4 ${
                index < accounts.length - 1 ? "border-b border-border" : ""
              }`}
              onPress={() => onAccountPress(account)}
            >
              <View
                className="size-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: account.iconBackground }}
              >
                <Icon color={account.color} size={21} strokeWidth={2.2} />
              </View>

              <View className="ml-3 flex-1">
                <Text className="font-manrope-bold text-sm text-foreground">
                  {account.name}
                </Text>
                <Text className="mt-0.5 font-sans text-xs text-muted">
                  {account.institution} · •••• {account.lastFour}
                </Text>
              </View>

              <View className="ml-2 items-end gap-1.5">
                <Text
                  className={`font-manrope-bold text-sm ${
                    account.balance < 0 ? "text-[#ef8175]" : "text-foreground"
                  }`}
                >
                  {account.balance < 0 ? "-" : ""}
                  {formatCurrency(account.balance)}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Chip color="default" size="sm" variant="tertiary">
                    <Chip.Label className="font-manrope-semibold capitalize">
                      {account.kind}
                    </Chip.Label>
                  </Chip>
                  <ChevronRight color="#8e8e8e" size={15} strokeWidth={2.3} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </Card.Body>
    </Card>
  );
}
