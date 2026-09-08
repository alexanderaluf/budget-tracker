import { StyleSheet, Text, View } from "react-native";

import { formatCurrency } from "@/shared/lib/currency";
import { FilledIcon } from "@/shared/ui/filled-icon";

import { colorForeground } from "../account-options";
import { withAlpha } from "../lib/card-color";
import type { Account } from "../types";
import { AccountIcon } from "./account-icon";

const INCOME = "#82d6a1";
const EXPENSE = "#ef8175";

const kindLabels: Record<Account["kind"], string> = {
  bank: "Bank account",
  checking: "Checking account",
  savings: "Savings account",
  cash: "Cash",
  credit: "Credit card",
};

export function BankAccountCard({ account }: { account: Account }) {
  const net = account.income - account.expense;
  const flow = account.income + account.expense;
  const incomeShare = flow > 0 ? account.income / flow : 0.5;
  const subtitle = [
    account.bankName || kindLabels[account.kind],
    account.accountNumber ? `•••• ${account.accountNumber.slice(-4)}` : "",
    account.ownerName,
  ]
    .filter(Boolean)
    .join(" · ");
  const badges = [
    account.isDefault ? "Default" : "",
    account.isExcluded ? "Excluded" : "",
  ].filter(Boolean);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: withAlpha(account.color, 0.09),
          borderColor: withAlpha(account.color, 0.28),
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: account.color }]}>
          <AccountIcon
            color={colorForeground(account.color)}
            name={account.icon}
            pathData={account.iconPath}
            size={24}
          />
        </View>
        <View style={styles.identity}>
          <Text
            className="font-manrope-bold text-base text-foreground"
            numberOfLines={1}
          >
            {account.name}
          </Text>
          <Text className="font-sans text-xs text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.balance}>
          <Text
            className="font-manrope-medium text-[10px]"
            style={[styles.overline, { color: withAlpha(account.color, 0.9) }]}
          >
            {account.currencyCode} balance
          </Text>
          <Text
            className="font-manrope-bold text-2xl text-foreground"
            numberOfLines={1}
            style={account.balance < 0 ? { color: EXPENSE } : undefined}
          >
            {account.balance < 0 ? "−" : ""}
            {formatCurrency(account.balance, account.currencyCode)}
          </Text>
        </View>
      </View>

      <View style={styles.flowBar}>
        <View
          style={[
            styles.flowSegment,
            { backgroundColor: INCOME, flex: Math.max(incomeShare, 0.02) },
          ]}
        />
        <View
          style={[
            styles.flowSegment,
            {
              backgroundColor: EXPENSE,
              flex: Math.max(1 - incomeShare, 0.02),
            },
          ]}
        />
      </View>

      <View style={styles.stats}>
        <Stat
          color={INCOME}
          currencyCode={account.currencyCode}
          icon="arrow-bottom-left"
          label="In · all time"
          value={account.income}
        />
        <View
          style={[
            styles.divider,
            { backgroundColor: withAlpha(account.color, 0.28) },
          ]}
        />
        <Stat
          color={EXPENSE}
          currencyCode={account.currencyCode}
          icon="arrow-top-right"
          label="Out · all time"
          value={account.expense}
        />
        <View
          style={[
            styles.divider,
            { backgroundColor: withAlpha(account.color, 0.28) },
          ]}
        />
        <Stat
          color={net < 0 ? EXPENSE : INCOME}
          currencyCode={account.currencyCode}
          icon={net < 0 ? "trending-down" : "trending-up"}
          label="Net flow"
          prefix={net < 0 ? "−" : "+"}
          value={net}
        />
      </View>

      {badges.length > 0 && (
        <View style={styles.badges}>
          {badges.map((badge) => (
            <View
              key={badge}
              style={[
                styles.badge,
                { borderColor: withAlpha(account.color, 0.35) },
              ]}
            >
              <Text
                className="font-manrope-semibold text-[10px]"
                style={[
                  styles.overline,
                  { color: withAlpha(account.color, 0.95) },
                ]}
              >
                {badge}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Stat({
  color,
  currencyCode,
  icon,
  label,
  prefix = "",
  value,
}: {
  color: string;
  currencyCode: string;
  icon:
    "arrow-bottom-left" | "arrow-top-right" | "trending-up" | "trending-down";
  label: string;
  prefix?: string;
  value: number;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statLabel}>
        <FilledIcon color={color} name={icon} size={13} />
        <Text
          className="font-manrope-medium text-[10px] text-muted"
          numberOfLines={1}
          style={styles.overline}
        >
          {label}
        </Text>
      </View>
      <Text
        className="font-manrope-bold text-sm"
        numberOfLines={1}
        style={{ color }}
      >
        {prefix}
        {formatCurrency(value, currencyCode)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badges: { flexDirection: "row", gap: 6 },
  balance: { alignItems: "flex-end", gap: 1 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    overflow: "hidden",
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  divider: { alignSelf: "stretch", marginVertical: 2, width: 1 },
  flowBar: {
    borderRadius: 999,
    flexDirection: "row",
    gap: 3,
    height: 5,
    overflow: "hidden",
  },
  flowSegment: { borderRadius: 999, height: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  icon: {
    alignItems: "center",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  identity: { flex: 1, gap: 2 },
  overline: { letterSpacing: 0.6, textTransform: "uppercase" },
  stat: { flex: 1, gap: 3 },
  statLabel: { alignItems: "center", flexDirection: "row", gap: 5 },
  stats: { flexDirection: "row", gap: 12 },
});
