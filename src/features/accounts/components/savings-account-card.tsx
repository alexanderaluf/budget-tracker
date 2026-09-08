import { StyleSheet, Text, View } from "react-native";

import { formatCurrency } from "@/shared/lib/currency";
import { useAppThemeColors } from "@/shared/theme/app-theme";
import { FilledIcon } from "@/shared/ui/filled-icon";

import { colorForeground } from "../account-options";
import { withAlpha } from "../lib/card-color";
import type { Account } from "../types";
import { AccountIcon } from "./account-icon";

const GROWTH = "#82d6a1";

export function SavingsAccountCard({ account }: { account: Account }) {
  const theme = useAppThemeColors();
  const summary = account.savingsSummary;
  if (summary && !summary.isDetailed) {
    return <SimpleSavingsAccountCard account={account} />;
  }
  const principal = summary?.principal ?? Math.max(account.balance, 0);
  const earnings = summary?.earnings ?? 0;
  const total = principal + earnings;
  const principalShare = total > 0 ? principal / total : 1;
  const monthlyFunding =
    (summary?.monthlyContribution ?? 0) +
    (summary?.employerMonthlyContribution ?? 0);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: withAlpha(account.color, 0.09),
          borderColor: withAlpha(account.color, 0.3),
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
            Savings · {account.currencyCode}
          </Text>
          <Text
            className="font-manrope-bold text-lg text-foreground"
            numberOfLines={1}
          >
            {account.name}
          </Text>
        </View>
        {account.isExcluded && (
          <View
            style={[
              styles.badge,
              { backgroundColor: withAlpha(account.color, 0.14) },
            ]}
          >
            <Text
              className="font-manrope-semibold text-[10px]"
              style={{ color: account.color }}
            >
              Excluded
            </Text>
          </View>
        )}
      </View>

      <View
        style={[styles.details, { borderColor: withAlpha(account.color, 0.2) }]}
      >
        <Detail
          label="Product"
          value={summary?.productLabel ?? "Savings account"}
        />
        <Detail
          label="Provider"
          value={summary?.providerName || "Not specified"}
        />
        {!!summary?.maturityDate && (
          <Detail label="Matures" value={summary.maturityDate} />
        )}
      </View>

      <View style={styles.balanceBlock}>
        <Text className="font-manrope-medium text-xs text-muted">
          Current savings value
        </Text>
        <Text
          adjustsFontSizeToFit
          className="font-manrope-bold text-3xl text-foreground"
          minimumFontScale={0.68}
          numberOfLines={1}
        >
          {formatCurrency(account.balance, account.currencyCode)}
        </Text>
      </View>

      <View style={styles.compositionHeader}>
        <Text
          className="font-manrope-medium text-[10px] text-muted"
          style={styles.overline}
        >
          Value composition
        </Text>
        {!!summary?.expectedAnnualReturnRate && (
          <Text
            className="font-manrope-semibold text-xs"
            style={{ color: GROWTH }}
          >
            {summary.expectedAnnualReturnRate}% expected / year
          </Text>
        )}
      </View>
      <View style={styles.compositionBar}>
        <View
          style={{
            backgroundColor: account.color,
            flex: Math.max(principalShare, 0.02),
          }}
        />
        <View
          style={{
            backgroundColor: GROWTH,
            flex: Math.max(1 - principalShare, 0.02),
          }}
        />
      </View>

      <View style={styles.stats}>
        <Stat
          color={account.color}
          currencyCode={account.currencyCode}
          label="Your principal"
          value={principal}
        />
        <View
          style={[
            styles.divider,
            { backgroundColor: withAlpha(account.color, 0.28) },
          ]}
        />
        <Stat
          color={GROWTH}
          currencyCode={account.currencyCode}
          label="Earned growth"
          value={earnings}
        />
        <View
          style={[
            styles.divider,
            { backgroundColor: withAlpha(account.color, 0.28) },
          ]}
        />
        <Stat
          color={theme.foreground}
          currencyCode={account.currencyCode}
          label="Est. withdrawal"
          value={
            summary?.estimatedNetWithdrawal ?? Math.max(account.balance, 0)
          }
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <FilledIcon name="clock" size={15} tone="muted" />
          <Text className="font-sans text-xs text-muted" numberOfLines={1}>
            {summary?.liquidityLabel ?? "Access not specified"}
          </Text>
        </View>
        {monthlyFunding > 0 && (
          <Text className="font-manrope-semibold text-xs text-foreground">
            {formatCurrency(monthlyFunding, account.currencyCode)} / month
          </Text>
        )}
      </View>
    </View>
  );
}

function SimpleSavingsAccountCard({ account }: { account: Account }) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: withAlpha(account.color, 0.09),
          borderColor: withAlpha(account.color, 0.3),
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
            Simple savings · {account.currencyCode}
          </Text>
          <Text
            className="font-manrope-bold text-lg text-foreground"
            numberOfLines={1}
          >
            {account.name}
          </Text>
        </View>
        {account.isExcluded && (
          <View
            style={[
              styles.badge,
              { backgroundColor: withAlpha(account.color, 0.14) },
            ]}
          >
            <Text
              className="font-manrope-semibold text-[10px]"
              style={{ color: account.color }}
            >
              Excluded
            </Text>
          </View>
        )}
      </View>

      {(account.accountNumber || account.ownerName) && (
        <View
          style={[
            styles.details,
            { borderColor: withAlpha(account.color, 0.2) },
          ]}
        >
          {!!account.accountNumber && (
            <Detail
              label="Account"
              value={`•••• ${account.accountNumber.slice(-4)}`}
            />
          )}
          {!!account.ownerName && (
            <Detail label="Owner" value={account.ownerName} />
          )}
        </View>
      )}

      <View style={styles.balanceBlock}>
        <Text className="font-manrope-medium text-xs text-muted">
          Current savings balance
        </Text>
        <Text
          adjustsFontSizeToFit
          className="font-manrope-bold text-3xl text-foreground"
          minimumFontScale={0.68}
          numberOfLines={1}
        >
          {formatCurrency(account.balance, account.currencyCode)}
        </Text>
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
  label,
  value,
}: {
  color: string;
  currencyCode: string;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.stat}>
      <Text
        className="font-manrope-medium text-[10px] text-muted"
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="font-manrope-bold text-sm"
        minimumFontScale={0.68}
        numberOfLines={1}
        style={{ color }}
      >
        {formatCurrency(value, currencyCode)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  balanceBlock: { gap: 3, paddingVertical: 2 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    overflow: "hidden",
    padding: 16,
  },
  compositionBar: {
    borderRadius: 999,
    flexDirection: "row",
    gap: 3,
    height: 5,
    overflow: "hidden",
  },
  compositionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detail: { flex: 1, gap: 2, minWidth: 70 },
  details: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 14,
    paddingVertical: 10,
  },
  divider: { alignSelf: "stretch", marginVertical: 2, width: 1 },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerItem: { alignItems: "center", flex: 1, flexDirection: "row", gap: 6 },
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
  stats: { flexDirection: "row", gap: 10 },
});
