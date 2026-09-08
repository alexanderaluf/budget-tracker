import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { formatCurrency } from "@/shared/lib/currency";
import { FilledIcon } from "@/shared/ui/filled-icon";

import { cardPalette, withAlpha } from "../lib/card-color";
import type { Account } from "../types";
import { CardCompanyLogo } from "./card-company-logo";

const INCOME = "#82d6a1";
const EXPENSE = "#ef8175";

export function CreditAccountCard({ account }: { account: Account }) {
  const palette = cardPalette(account.color);
  const owed = account.balance < 0;
  const monthLabel = new Date().toLocaleDateString(undefined, {
    month: "long",
  });

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={palette.gradient}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.face}
      >
        <View
          pointerEvents="none"
          style={[
            styles.gloss,
            {
              backgroundColor: withAlpha(
                palette.light ? "#000000" : "#ffffff",
                0.09,
              ),
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.glossSmall,
            {
              backgroundColor: withAlpha(
                palette.light ? "#000000" : "#ffffff",
                0.07,
              ),
            },
          ]}
        />

        <View style={styles.faceRow}>
          <View style={styles.faceIdentity}>
            <Text
              className="font-manrope-bold text-base"
              numberOfLines={1}
              style={{ color: palette.ink }}
            >
              {account.name}
            </Text>
            <Text
              className="font-manrope-medium text-[11px]"
              numberOfLines={1}
              style={[styles.overline, { color: palette.inkMuted }]}
            >
              {account.cardCompany || "Credit card"}
              {account.linkedBankAccountName
                ? ` · ${account.linkedBankAccountName}`
                : ""}
            </Text>
          </View>
          <CardCompanyLogo
            company={account.cardCompany}
            height={40}
            palette={palette}
            width={64}
          />
        </View>

        <View style={styles.balanceBlock}>
          <Text
            className="font-manrope-medium text-[10px]"
            style={[styles.overline, { color: palette.inkMuted }]}
          >
            {owed ? "Current debt" : "Available"}
          </Text>
          <Text
            className="font-manrope-bold text-3xl"
            numberOfLines={1}
            style={{ color: palette.ink }}
          >
            {owed ? "−" : ""}
            {formatCurrency(account.balance, account.currencyCode)}
          </Text>
        </View>

        <View style={styles.faceRow}>
          <View style={styles.chipRow}>
            <LinearGradient
              colors={["#f6e6bb", "#c9a86a", "#efdcae"]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.chip}
            >
              <View style={styles.chipLine} />
              <View style={styles.chipLine} />
            </LinearGradient>
            <FilledIcon color={palette.inkMuted} name="nfc" size={20} />
          </View>
          <Text
            className="font-manrope-semibold text-base"
            style={[styles.pan, { color: palette.ink }]}
          >
            ••••{"  "}
            {account.lastFour || "••••"}
          </Text>
        </View>

        <View style={[styles.faceFooter, { borderTopColor: palette.hairline }]}>
          <Text
            className="font-manrope-semibold text-[11px]"
            numberOfLines={1}
            style={[styles.overline, { color: palette.inkMuted, flex: 1 }]}
          >
            {account.ownerName || "Cardholder"}
          </Text>
          <Text
            className="font-manrope-semibold text-[11px]"
            style={[styles.overline, { color: palette.inkMuted }]}
          >
            {account.currencyCode}
            {account.paymentDay != null
              ? ` · pays ${String(account.paymentDay).padStart(2, "0")}`
              : ""}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.monthRow}>
        <MonthStat
          amount={account.monthlyIncome}
          color={INCOME}
          currencyCode={account.currencyCode}
          icon="arrow-bottom-left"
          label={`${monthLabel} income`}
        />
        <View
          style={[
            styles.monthDivider,
            { backgroundColor: withAlpha(account.color, 0.35) },
          ]}
        />
        <MonthStat
          amount={account.monthlyExpense}
          color={EXPENSE}
          currencyCode={account.currencyCode}
          icon="arrow-top-right"
          label={`${monthLabel} spend`}
        />
      </View>
    </View>
  );
}

function MonthStat({
  amount,
  color,
  currencyCode,
  icon,
  label,
}: {
  amount: number;
  color: string;
  currencyCode: string;
  icon: "arrow-bottom-left" | "arrow-top-right";
  label: string;
}) {
  return (
    <View style={styles.monthStat}>
      <View style={styles.monthLabel}>
        <FilledIcon color={color} name={icon} size={14} />
        <Text
          className="font-manrope-medium text-[11px] text-muted"
          numberOfLines={1}
          style={styles.overline}
        >
          {label}
        </Text>
      </View>
      <Text
        className="font-manrope-bold text-lg"
        numberOfLines={1}
        style={{ color }}
      >
        {formatCurrency(amount, currencyCode)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceBlock: { gap: 2 },
  chip: {
    alignItems: "center",
    borderRadius: 6,
    gap: 3,
    height: 26,
    justifyContent: "center",
    width: 34,
  },
  chipLine: {
    backgroundColor: "rgba(120, 92, 32, 0.55)",
    borderRadius: 1,
    height: 1.5,
    width: 20,
  },
  chipRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  face: {
    aspectRatio: 1.586,
    borderRadius: 24,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: 18,
  },
  faceFooter: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    paddingTop: 10,
  },
  faceIdentity: { flex: 1, gap: 3 },
  faceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  gloss: {
    borderRadius: 999,
    height: 260,
    position: "absolute",
    right: -90,
    top: -140,
    width: 260,
  },
  glossSmall: {
    borderRadius: 999,
    bottom: -110,
    height: 190,
    left: -70,
    position: "absolute",
    width: 190,
  },
  monthDivider: { alignSelf: "stretch", marginVertical: 2, width: 1 },
  monthLabel: { alignItems: "center", flexDirection: "row", gap: 6 },
  monthRow: { flexDirection: "row", gap: 16, paddingHorizontal: 4 },
  monthStat: { flex: 1, gap: 4 },
  overline: { letterSpacing: 0.6, textTransform: "uppercase" },
  pan: { letterSpacing: 2 },
  wrapper: { gap: 14 },
});
