import { useLocalData } from "@/data/local-data-provider";
import { deleteAccountFromDocument } from "@/data/model/account-record";
import {
    accountPeriodRange,
    filterAccountTransactions,
    selectAccounts,
    selectAccountTransactions,
} from "@/data/selectors/document-selectors";
import { formatCurrency } from "@/shared/lib/currency";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BottomSheet, Button } from "heroui-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AccountCard } from "./components/account-card";
import { AccountPeriodSelector } from "./components/account-period-selector";
import type { AccountPeriod } from "./types";

export function AccountDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { document, updateDocument } = useLocalData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<AccountPeriod>("Monthly");
  const [anchor, setAnchor] = useState(() => new Date());
  const [allTime, setAllTime] = useState(true);
  const [menu, setMenu] = useState<"actions" | "confirm" | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [deleteError, setDeleteError] = useState("");
  const account = useMemo(
    () => selectAccounts(document).find((item) => item.id === id),
    [document, id],
  );
  const transactions = useMemo(
    () => selectAccountTransactions(document, id),
    [document, id],
  );
  const visible = useMemo(
    () =>
      allTime
        ? transactions
        : filterAccountTransactions(transactions, period, anchor),
    [transactions, allTime, period, anchor],
  );
  const totals = useMemo(
    () =>
      [...new Set(visible.map((item) => item.currencyCode))].map(
        (currency) => ({
          currency,
          income: visible
            .filter(
              (item) =>
                item.currencyCode === currency && item.type === "income",
            )
            .reduce((sum, item) => sum + item.amount, 0),
          expense: visible
            .filter(
              (item) =>
                item.currencyCode === currency && item.type === "expense",
            )
            .reduce((sum, item) => sum + item.amount, 0),
        }),
      ),
    [visible],
  );
  const { start, end } = accountPeriodRange(period, anchor);
  const dateLabel = allTime
    ? "All transaction history"
    : `${start.toLocaleDateString()}${period === "Daily" ? "" : ` – ${new Date(end.getTime() - 1).toLocaleDateString()}`}`;
  const isMenuMounted = menu !== null;

  useEffect(() => {
    if (!isMenuMounted) {
      setIsMenuOpen(false);
      return;
    }
    const frame = requestAnimationFrame(() => setIsMenuOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [isMenuMounted]);

  function movePeriod(direction: number) {
    const next = new Date(start);
    if (period === "Yearly") next.setFullYear(next.getFullYear() + direction);
    else if (period === "Monthly") next.setMonth(next.getMonth() + direction);
    else
      next.setDate(next.getDate() + direction * (period === "Weekly" ? 7 : 1));
    setAnchor(next);
    setAllTime(false);
  }

  function editAccount() {
    setIsMenuOpen(false);
    setTimeout(() => {
      router.push({ pathname: "/accounts/[id]/edit", params: { id } });
    }, 220);
  }

  async function deleteAccount() {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      await updateDocument((current) =>
        deleteAccountFromDocument(current, id, new Date().toISOString()),
      );
      setMenu(null);
      router.dismissTo("/accounts");
    } catch (reason) {
      setDeleteError(
        reason instanceof Error
          ? reason.message
          : "Unable to delete this account. Please try again.",
      );
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  if (!account)
    return (
      <SafeAreaView style={styles.screen}>
        <Text className="px-5 py-6 text-foreground">Account not found.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.dismissTo("/accounts")}
          style={styles.action}
        >
          <Text className="text-accent">Back to accounts</Text>
        </Pressable>
      </SafeAreaView>
    );

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to accounts"
          onPress={() => router.dismissTo("/accounts")}
          style={styles.iconButton}
        >
          <FilledIcon name="arrow-left" color="#ededed" size={26} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="flex-1 font-manrope-bold text-xl text-foreground"
        >
          Account details
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account options"
          onPress={() => setMenu("actions")}
          style={styles.iconButton}
        >
          <Text style={{ color: "#ededed", fontSize: 30 }}>⋮</Text>
        </Pressable>
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 110 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            <AccountCard account={account} />
            <View style={styles.summary}>
              <Text className="font-manrope-bold text-base text-accent">
                {allTime ? "All time" : `${period} activity`}
              </Text>
              {(totals.length
                ? totals
                : [{ currency: account.currencyCode, income: 0, expense: 0 }]
              ).map((total) => (
                <View key={total.currency} style={styles.row}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text className="text-sm text-muted">
                      Income · {total.currency}
                    </Text>
                    <Text className="font-manrope-bold text-lg text-[#82d6a1]">
                      {formatCurrency(total.income, total.currency)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text className="text-sm text-muted">
                      Expense · {total.currency}
                    </Text>
                    <Text className="font-manrope-bold text-lg text-[#ef8175]">
                      {formatCurrency(total.expense, total.currency)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.row}>
              <Text
                accessibilityRole="header"
                className="flex-1 font-manrope-bold text-lg text-foreground"
              >
                Transactions ({visible.length})
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: allTime }}
                onPress={() => setAllTime(true)}
                style={styles.iconButton}
              >
                <Text className="font-manrope-semibold text-sm text-accent">
                  All history
                </Text>
              </Pressable>
            </View>
            <View style={[styles.row, { marginBottom: 12 }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous period"
                onPress={() => movePeriod(-1)}
                style={styles.iconButton}
              >
                <Text className="text-xl text-foreground">‹</Text>
              </Pressable>
              <Text className="flex-1 text-center font-sans text-sm text-muted">
                {dateLabel}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next period"
                onPress={() => movePeriod(1)}
                style={styles.iconButton}
              >
                <Text className="text-xl text-foreground">›</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.transaction}>
            <FilledIcon
              name={
                item.type === "income"
                  ? "arrow-bottom-left"
                  : item.type === "expense"
                    ? "arrow-top-right"
                    : "swap-horizontal"
              }
              color={
                item.type === "income"
                  ? "#82d6a1"
                  : item.type === "expense"
                    ? "#ef8175"
                    : "#70d2eb"
              }
              size={24}
            />
            <View style={{ flex: 1, gap: 5 }}>
              <Text className="font-manrope-semibold text-base text-foreground">
                {item.name}
              </Text>
              <Text className="font-sans text-xs text-muted">
                {item.type === "transfer" ? "Transfer" : item.category} ·{" "}
                {item.timestamp == null
                  ? "Unknown date"
                  : new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <Text
              className="font-manrope-bold text-sm"
              style={{ color: item.type === "income" ? "#82d6a1" : "#ededed" }}
            >
              {item.type === "income"
                ? "+"
                : item.type === "expense"
                  ? "−"
                  : ""}
              {formatCurrency(item.amount, item.currencyCode)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text className="py-10 text-center font-sans text-base text-muted">
            {transactions.length
              ? "No transactions in this period. Browse another period or select All history."
              : "No transactions for this account yet."}
          </Text>
        }
      />
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "rgba(0,0,0,0.8)", "#000000"]}
        style={[styles.scrim, { height: 110 + insets.bottom }]}
      />
      <View style={[styles.dock, { bottom: Math.max(insets.bottom, 10) }]}>
        <AccountPeriodSelector
          value={period}
          onChange={(value) => {
            setPeriod(value);
            setAllTime(false);
          }}
        />
      </View>
      {isMenuMounted && (
        <BottomSheet
          isOpen={isMenuOpen}
          onOpenChange={(open) => {
            if (!open && !deleting) {
              setIsMenuOpen(false);
            }
          }}
        >
          <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
            <BottomSheet.Overlay isCloseOnPress={!deleting} />
            <BottomSheet.Content
              bottomInset={insets.bottom}
              topInset={insets.top}
              enablePanDownToClose={!deleting}
              contentContainerClassName="px-5 pb-0 pt-1"
              backgroundClassName="rounded-t-[28px] bg-surface"
              handleIndicatorClassName="w-10 bg-muted/40"
              onClose={() => {
                setMenu(null);
                setDeleteError("");
              }}
            >
              <View
                className="gap-4"
                style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
              >
                {menu === "confirm" ? (
                  <>
                    <View className="gap-2">
                      <BottomSheet.Title>Delete account?</BottomSheet.Title>
                      <BottomSheet.Description className="font-sans text-base leading-6">
                        {transactions.length
                          ? `Deleting ${account.name} will permanently delete this account and all ${transactions.length} related transactions. This cannot be undone.`
                          : `Permanently delete ${account.name}? This cannot be undone.`}
                      </BottomSheet.Description>
                    </View>
                    {!!deleteError && (
                      <Text accessibilityRole="alert" className="text-danger">
                        {deleteError}
                      </Text>
                    )}
                    <View className="flex-row gap-3">
                      <Button
                        className="flex-1"
                        variant="tertiary"
                        isDisabled={deleting}
                        onPress={() => setMenu("actions")}
                      >
                        <Button.Label>Cancel</Button.Label>
                      </Button>
                      <Button
                        className="flex-1"
                        variant="danger"
                        isDisabled={deleting}
                        accessibilityLabel={
                          deleting ? "Deleting account" : "Delete account"
                        }
                        accessibilityState={{ busy: deleting }}
                        onPress={deleteAccount}
                      >
                        <Button.Label>
                          {deleting ? "Deleting…" : "Delete"}
                        </Button.Label>
                      </Button>
                    </View>
                  </>
                ) : (
                  <>
                    <View className="gap-1">
                      <BottomSheet.Title>{account.name}</BottomSheet.Title>
                      {!!account.ownerName && (
                        <BottomSheet.Description>
                          {account.ownerName}
                        </BottomSheet.Description>
                      )}
                    </View>
                    <Button
                      className="w-full justify-start"
                      variant="secondary"
                      onPress={editAccount}
                    >
                      <FilledIcon name="pencil" color="#ededed" size={22} />
                      <Button.Label>Edit account</Button.Label>
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="danger-soft"
                      onPress={() => {
                        setDeleteError("");
                        setMenu("confirm");
                      }}
                    >
                      <Button.Label>Delete account</Button.Label>
                    </Button>
                  </>
                )}
              </View>
            </BottomSheet.Content>
          </BottomSheet.Portal>
        </BottomSheet>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  summary: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#171717",
    gap: 18,
  },
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#232323",
  },
  scrim: { position: "absolute", bottom: 0, left: 0, right: 0 },
  dock: { position: "absolute", left: 12, right: 12 },
  action: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});
