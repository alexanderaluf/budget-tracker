import { StyleSheet, Text, View } from "react-native";
import { formatCurrency } from "@/shared/lib/currency";
import { colorForeground } from "../account-options";
import type { Account } from "../types";
import { AccountIcon } from "./account-icon";
import { CardCompanyLogo } from "./card-company-logo";

export function AccountCard({ account }: { account: Account }) {
  const kind = account.kind === "credit" || account.kind === "checking" ? "Card" : account.kind === "cash" ? "Cash" : "Savings";
  return (
    <View style={[styles.card, { backgroundColor: `${account.color}30`, borderColor: `${account.color}45` }]}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: account.color }]}>
          <AccountIcon name={account.icon} pathData={account.iconPath} color={colorForeground(account.color)} size={30} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text className="font-manrope-bold text-xs" style={{ color: account.color }}>{kind} · {account.currencyCode}</Text>
          <Text className="font-manrope-bold text-lg text-foreground">{account.name}</Text>
          {!!account.ownerName && <Text className="font-sans text-sm text-muted">{account.ownerName}</Text>}
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Text className="font-sans text-sm text-muted">Total balance</Text>
        <Text className="font-manrope-bold text-3xl" style={{ color: account.color }}>
          {account.balance < 0 ? "−" : ""}{formatCurrency(account.balance, account.currencyCode)}
        </Text>
      </View>
      {!!account.accountNumber && <Text className="font-sans text-sm text-foreground">Account number · {account.accountNumber}</Text>}
      {(account.cardCompany || account.lastFour && kind === "Card") ? (
        <View style={styles.row}>
          {!!account.cardCompany && <CardCompanyLogo company={account.cardCompany} />}
          <View style={{ flex: 1, gap: 4 }}>
            <Text className="font-manrope-semibold text-sm text-foreground">{account.cardCompany || "Card"}{account.lastFour ? ` · •••• ${account.lastFour}` : ""}</Text>
            {account.paymentDay != null && <Text className="font-sans text-xs text-muted">Paid on day {account.paymentDay} each month</Text>}
          </View>
        </View>
      ) : null}
      <View style={[styles.row, { paddingTop: 8, borderTopWidth: 1, borderTopColor: `${account.color}30` }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text className="font-sans text-xs text-muted">Income · all time</Text>
          <Text className="font-manrope-bold text-base text-[#82d6a1]">{formatCurrency(account.income, account.currencyCode)}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text className="font-sans text-xs text-muted">Expense · all time</Text>
          <Text className="font-manrope-bold text-base text-[#ef8175]">{formatCurrency(account.expense, account.currencyCode)}</Text>
        </View>
      </View>
      <Text className="font-sans text-xs text-muted">
        {account.isDefault ? "Default account" : "Not default"} · {account.isExcluded ? "Excluded from totals" : "Included in totals"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 28, padding: 20, gap: 18, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 56, height: 56, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
