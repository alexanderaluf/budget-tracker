import { LinearGradient } from "expo-linear-gradient";
import { Card } from "heroui-native";
import { Eye, EyeOff, Nfc } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatCurrency } from "@/shared/lib/currency";

import type { PaymentCardDetails } from "../types";
import { CardBrand } from "./card-brand";
import { EmvChip } from "./emv-chip";

type PaymentCardProps = {
  card: PaymentCardDetails;
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
};

export function PaymentCard({
  card,
  isBalanceVisible,
  onToggleBalance,
}: PaymentCardProps) {
  const VisibilityIcon = isBalanceVisible ? Eye : EyeOff;
  const numberGroups = ["••••", "••••", "••••", card.lastFour];

  return (
    <Card
      accessibilityLabel={`${card.brand} card ending in ${card.lastFour}`}
      className="overflow-hidden border border-white/10 bg-[#0f2a34] p-0"
      style={{ aspectRatio: 1.6 }}
    >
      <LinearGradient
        colors={["#1b4a58", "#11313d", "#0a1f27"]}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0)"]}
        end={{ x: 0.9, y: 1 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View className="flex-1 justify-between p-5">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="font-manrope-bold text-[15px] uppercase tracking-[2px] text-white">
              {card.issuer}
            </Text>
            <Text className="mt-1 font-sans text-[9px] uppercase tracking-[2px] text-white/50">
              {card.tier}
            </Text>
          </View>

          <CardBrand brand={card.brand} />
        </View>

        <View className="flex-row items-end justify-between">
          <View className="flex-row items-center gap-3">
            <EmvChip />
            <Nfc color="#ffffff" size={20} strokeWidth={2.2} />
          </View>

          <View className="items-end">
            <View className="flex-row items-center gap-2">
              <Text className="font-sans text-[9px] uppercase tracking-[2px] text-white/50">
                Balance
              </Text>
              <Pressable
                accessibilityLabel={
                  isBalanceVisible ? "Hide card balance" : "Show card balance"
                }
                accessibilityRole="button"
                hitSlop={10}
                onPress={onToggleBalance}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <VisibilityIcon color="#ffffff" size={14} strokeWidth={2.3} />
              </Pressable>
            </View>
            <Text
              accessibilityLabel={
                isBalanceVisible
                  ? `Available balance ${formatCurrency(card.balance)}`
                  : "Available balance hidden"
              }
              className="mt-0.5 font-manrope-bold text-[26px] text-white"
              style={{ lineHeight: 31 }}
            >
              {isBalanceVisible ? formatCurrency(card.balance) : "••••••"}
            </Text>
          </View>
        </View>

        <View className="gap-3.5">
          <View className="flex-row items-center justify-between">
            {numberGroups.map((group, index) => (
              <Text
                key={`${group}-${index}`}
                className="font-manrope-semibold text-[17px] tracking-[2px] text-white"
              >
                {group}
              </Text>
            ))}
          </View>

          <View className="flex-row items-end justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-sans text-[8px] uppercase tracking-[2px] text-white/45">
                Cardholder
              </Text>
              <Text
                className="mt-1 font-manrope-semibold text-[12px] uppercase tracking-[1.5px] text-white"
                numberOfLines={1}
              >
                {card.cardholder}
              </Text>
            </View>

            <View className="items-end">
              <Text className="font-sans text-[8px] uppercase tracking-[2px] text-white/45">
                Valid thru
              </Text>
              <Text className="mt-1 font-manrope-semibold text-[12px] tracking-[1.5px] text-white">
                {card.expiresAt}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}
