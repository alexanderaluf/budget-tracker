import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { formatCurrency } from "@/shared/lib/currency";
import { Text } from "@/shared/ui/app-text";
import { FilledIcon } from "@/shared/ui/filled-icon";

import { colorForeground } from "../account-options";
import { withAlpha } from "../lib/card-color";
import type { Account } from "../types";
import { AccountIcon } from "./account-icon";

const INCOME = "#82d6a1";
const EXPENSE = "#ef8175";

export function BankAccountCard({ account }: { account: Account }) {
  const { t } = useTranslation();
  const net = account.income - account.expense;
  const flow = account.income + account.expense;
  const incomeShare = flow > 0 ? account.income / flow : 0.5;
  const badges = [
    account.isDefault ? t("accounts.common.badges.default") : "",
    account.isExcluded ? t("accounts.common.badges.excluded") : "",
  ].filter(Boolean);
  const kindLabels: Record<Account["kind"], string> = {
    bank: t("accounts.common.kinds.bank"),
    checking: t("accounts.common.kinds.checking"),
    savings: t("accounts.common.kinds.savings"),
    cash: t("accounts.common.kinds.cash"),
    credit: t("accounts.common.kinds.credit"),
  };

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
            className="font-manrope-semibold text-[10px]"
            style={[styles.overline, { color: account.color }]}
          >
            {kindLabels[account.kind]} · {account.currencyCode}
          </Text>
          <Text
            className="font-manrope-bold text-lg text-foreground"
            numberOfLines={1}
          >
            {account.name}
          </Text>
        </View>
        <View style={styles.badges}>
          {badges.map((badge) => (
            <View
              key={badge}
              style={[
                styles.badge,
                { backgroundColor: withAlpha(account.color, 0.14) },
              ]}
            >
              <Text
                className="font-manrope-semibold text-[10px]"
                style={{ color: account.color }}
              >
                {badge}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View
        style={[styles.details, { borderColor: withAlpha(account.color, 0.2) }]}
      >
        <Detail
          label={t("accounts.common.details.institution")}
          value={
            account.bankName ||
            account.institution ||
            t("accounts.common.details.localAccount")
          }
        />
        {!!account.accountNumber && (
          <Detail
            label={t("accounts.common.details.account")}
            value={`•••• ${account.accountNumber.slice(-4)}`}
          />
        )}
        {!!account.ownerName && (
          <Detail
            label={t("accounts.common.details.owner")}
            value={account.ownerName}
          />
        )}
      </View>

      <View style={styles.balanceBlock}>
        <Text className="font-manrope-medium text-xs text-muted">
          {t("accounts.cards.currentBalance")}
        </Text>
        <Text
          adjustsFontSizeToFit
          className="font-manrope-bold text-3xl text-foreground"
          minimumFontScale={0.68}
          numberOfLines={1}
          style={account.balance < 0 ? { color: EXPENSE } : undefined}
        >
          {account.balance < 0 ? "−" : ""}
          {formatCurrency(account.balance, account.currencyCode)}
        </Text>
      </View>

      <Text
        className="font-manrope-medium text-[10px] text-muted"
        style={styles.overline}
      >
        {t("accounts.cards.allTimeActivity")}
      </Text>
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
          label={t("accounts.cards.income")}
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
          label={t("accounts.cards.expenses")}
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
          label={t("accounts.cards.net")}
          prefix={net < 0 ? "−" : "+"}
          value={net}
        />
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text className="font-manrope-medium text-[10px] text-muted">
        {label}
      </Text>
      <Text
        className="font-manrope-semibold text-xs text-foreground"
        numberOfLines={1}
      >
        {value}
      </Text>
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
        adjustsFontSizeToFit
        minimumFontScale={0.72}
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
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badges: { alignItems: "flex-end", gap: 5 },
  balanceBlock: { gap: 3, paddingVertical: 2 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    overflow: "hidden",
    padding: 16,
  },
  detail: { flex: 1, gap: 2, minWidth: 72 },
  details: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 14,
    paddingVertical: 10,
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
  identity: { flex: 1, gap: 1 },
  overline: { letterSpacing: 0.6, textTransform: "uppercase" },
  stat: { flex: 1, gap: 3 },
  statLabel: { alignItems: "center", flexDirection: "row", gap: 5 },
  stats: { flexDirection: "row", gap: 10 },
});
