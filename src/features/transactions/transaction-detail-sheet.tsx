import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { BottomSheet, Button, useThemeColor } from "heroui-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  deleteAttachment,
  getAttachmentFile,
} from "@/data/attachments/attachment-store";
import { useLocalData } from "@/data/local-data-provider";
import { deleteTransaction } from "@/data/model/transaction-record";
import { useProfiles } from "@/features/profile/profile-provider";
import type { Transaction } from "@/features/home/types";
import { formatCurrency } from "@/shared/lib/currency";
import { colorWithAlpha, useAppThemeColors } from "@/shared/theme/app-theme";
import { Text } from "@/shared/ui/app-text";
import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";
import { RecordIcon } from "@/shared/ui/record-icon";

function DetailRow({
  icon,
  label,
  value,
  leading,
}: {
  icon: FilledIconName;
  label: string;
  value: string;
  leading?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-4 py-3">
      <View className="size-10 items-center justify-center">
        {leading ?? <FilledIcon name={icon} size={24} tone="muted" />}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-sans text-sm text-muted">{label}</Text>
        <Text className="font-manrope-semibold text-base text-foreground">
          {value}
        </Text>
      </View>
    </View>
  );
}

export function TransactionDetailSheet({
  transaction,
  onDismiss,
}: {
  transaction: Transaction;
  onDismiss: () => void;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppThemeColors();
  const dangerForeground = useThemeColor("danger-foreground");
  const { updateDocument } = useLocalData();
  const { activeProfile } = useProfiles();
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] =
    useState(false);
  const opened = useRef(false);
  const openingFrame = useRef<number | null>(null);
  const receiptUri = (() => {
    if (!transaction.receiptPath) return null;
    try {
      return getAttachmentFile(transaction.receiptPath).uri;
    } catch {
      return null;
    }
  })();
  const occurredAt = new Date(transaction.occurredAtIso);
  const dateLabel = Number.isFinite(occurredAt.getTime())
    ? occurredAt.toLocaleString(i18n.resolvedLanguage, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : t("transactions.common.unknownDate");
  const typeLabel =
    transaction.type === 0
      ? t("transactions.common.types.expense")
      : transaction.type === 1
        ? t("transactions.common.types.income")
        : t("transactions.common.types.transfer");
  const amountColor =
    transaction.type === 0
      ? theme.danger
      : transaction.type === 1
        ? theme.success
        : theme.accent;

  useEffect(() => {
    return () => {
      if (openingFrame.current !== null)
        cancelAnimationFrame(openingFrame.current);
    };
  }, []);

  function openAfterLayout() {
    if (opened.current || openingFrame.current !== null) return;
    openingFrame.current = requestAnimationFrame(() => {
      openingFrame.current = null;
      opened.current = true;
      setIsOpen(true);
    });
  }

  function close() {
    if (busy) return;
    setIsOpen(false);
    onDismiss();
  }

  function edit() {
    onDismiss();
    router.push({
      pathname: "/transactions/[id]/edit",
      params: { id: transaction.id },
    });
  }

  function copy() {
    onDismiss();
    router.push({
      pathname: "/transactions/create",
      params: { copyId: transaction.id },
    });
  }

  function requestDelete() {
    setError("");
    setDeleteConfirmationVisible(true);
  }

  function cancelDelete() {
    if (busy) return;
    setError("");
    setDeleteConfirmationVisible(false);
  }

  function transactionDeleteError(reason: unknown) {
    if (!(reason instanceof Error))
      return t("transactions.details.deleteError");
    switch (reason.message) {
      case "This transaction no longer exists.":
        return t("transactions.form.validation.missing");
      case "This transaction belongs to another profile.":
        return t("transactions.form.validation.wrongProfile");
      case "This transaction has an invalid amount.":
        return t("transactions.form.validation.invalidAmount");
      case "This account has an invalid balance.":
        return t("transactions.details.invalidAccountBalance");
      default:
        return reason.message;
    }
  }

  async function confirmDelete() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await updateDocument((current) =>
        deleteTransaction(
          current,
          transaction.id,
          activeProfile.id,
          new Date().toISOString(),
        ),
      );
      if (transaction.receiptPath) {
        try {
          deleteAttachment(transaction.receiptPath);
        } catch {}
      }
      setIsOpen(false);
      onDismiss();
    } catch (reason) {
      setError(transactionDeleteError(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && opened.current && isOpen && !busy) close();
      }}
    >
      <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
        <BottomSheet.Overlay isCloseOnPress={!busy} />
        <BottomSheet.Content
          snapPoints={[deleteConfirmationVisible ? "38%" : "80%"]}
          enableDynamicSizing={false}
          enableOverDrag={false}
          enablePanDownToClose={!busy}
          enableHandlePanningGesture={!busy}
          enableContentPanningGesture={!busy}
          topInset={insets.top}
          contentContainerClassName="h-full px-0 pb-0 pt-1"
          backgroundClassName="rounded-t-[28px] bg-surface"
          handleIndicatorClassName="w-10 bg-muted/40"
        >
          <View onLayout={openAfterLayout} style={styles.fill}>
            {deleteConfirmationVisible ? (
              <Animated.View
                entering={FadeIn.duration(180).reduceMotion(
                  ReduceMotion.System,
                )}
                exiting={FadeOut.duration(120).reduceMotion(
                  ReduceMotion.System,
                )}
                className="flex-1 justify-center gap-5 px-5"
                style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
              >
                <View className="items-center gap-2">
                  <BottomSheet.Title className="text-center text-danger">
                    {t("transactions.details.deleteTitle")}
                  </BottomSheet.Title>
                  <BottomSheet.Description
                    numberOfLines={2}
                    className="px-3 text-center font-sans text-sm leading-5"
                  >
                    {t("transactions.details.deleteDescription", {
                      name: transaction.merchant,
                    })}
                  </BottomSheet.Description>
                </View>

                {!!error && (
                  <Text
                    accessibilityRole="alert"
                    className="text-center font-sans text-sm text-danger"
                  >
                    {error}
                  </Text>
                )}

                <View className="flex-row gap-3">
                  <Button
                    variant="tertiary"
                    className="flex-1"
                    isDisabled={busy}
                    onPress={cancelDelete}
                  >
                    <Button.Label>
                      {t("transactions.details.cancel")}
                    </Button.Label>
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    isDisabled={busy}
                    accessibilityState={{ busy }}
                    onPress={confirmDelete}
                  >
                    <FilledIcon
                      color={dangerForeground}
                      name="delete"
                      size={20}
                    />
                    <Button.Label>
                      {busy
                        ? t("transactions.details.deleting")
                        : t("transactions.details.delete")}
                    </Button.Label>
                  </Button>
                </View>
              </Animated.View>
            ) : (
              <>
                <BottomSheetScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  <View className="flex-row items-center gap-4 border-b border-border pb-5">
                    <View
                      className="size-16 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: colorWithAlpha(
                          transaction.color,
                          0.2,
                        ),
                      }}
                    >
                      <RecordIcon
                        color={transaction.color}
                        name={transaction.icon}
                        pathData={transaction.iconPath}
                        size={32}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <BottomSheet.Title numberOfLines={1}>
                        {transaction.merchant}
                      </BottomSheet.Title>
                      <BottomSheet.Description numberOfLines={2}>
                        {t("transactions.details.typeAndDate", {
                          type: typeLabel,
                          date: dateLabel,
                        })}
                      </BottomSheet.Description>
                    </View>
                    <Text
                      numberOfLines={1}
                      className="font-manrope-bold text-lg"
                      style={{ color: amountColor }}
                    >
                      {transaction.type === 1
                        ? "+"
                        : transaction.type === 0
                          ? "-"
                          : ""}
                      {formatCurrency(
                        transaction.absoluteAmount,
                        transaction.currencyCode,
                      )}
                    </Text>
                  </View>

                  <Text className="pt-5 font-manrope-bold text-base text-accent">
                    {t("transactions.details.heading")}
                  </Text>
                  <DetailRow
                    icon="credit-card"
                    label={
                      transaction.type === 2
                        ? t("transactions.common.fields.transferFrom")
                        : t("transactions.common.fields.account")
                    }
                    value={transaction.accountName}
                  />
                  {transaction.destinationAccountName ? (
                    <DetailRow
                      icon="credit-card"
                      label={t("transactions.common.fields.transferTo")}
                      value={transaction.destinationAccountName}
                    />
                  ) : null}
                  {transaction.categoryId ? (
                    <DetailRow
                      icon="chart-donut-variant"
                      label={t("transactions.common.fields.category")}
                      value={transaction.category}
                      leading={
                        <View
                          className="size-9 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: colorWithAlpha(
                              transaction.color,
                              0.2,
                            ),
                          }}
                        >
                          <RecordIcon
                            color={transaction.color}
                            name={transaction.icon}
                            pathData={transaction.iconPath}
                            size={21}
                          />
                        </View>
                      }
                    />
                  ) : null}
                  {transaction.description ? (
                    <DetailRow
                      icon="code-json"
                      label={t("transactions.common.fields.description")}
                      value={transaction.description}
                    />
                  ) : null}
                  {transaction.budgetName ? (
                    <DetailRow
                      icon="wallet"
                      label={t("transactions.common.fields.budget")}
                      value={transaction.budgetName}
                    />
                  ) : null}
                  {transaction.labelName ? (
                    <DetailRow
                      icon="check"
                      label={t("transactions.common.fields.label")}
                      value={transaction.labelName}
                    />
                  ) : null}
                  {transaction.loanName ? (
                    <DetailRow
                      icon="credit-card"
                      label={t("transactions.common.fields.loan")}
                      value={transaction.loanName}
                    />
                  ) : null}
                  {transaction.placeName ? (
                    <DetailRow
                      icon="home"
                      label={t("transactions.common.fields.place")}
                      value={transaction.placeName}
                    />
                  ) : null}
                  {transaction.personName ? (
                    <DetailRow
                      icon="account"
                      label={t("transactions.common.fields.payee")}
                      value={transaction.personName}
                    />
                  ) : null}

                  {receiptUri ? (
                    <View className="gap-2 pt-3">
                      <Text className="font-manrope-semibold text-sm text-muted">
                        {t("transactions.details.receipt")}
                      </Text>
                      <Image
                        accessibilityLabel={t(
                          "transactions.details.receiptAccessibility",
                          { name: transaction.merchant },
                        )}
                        resizeMode="cover"
                        source={{ uri: receiptUri }}
                        className="h-52 w-full rounded-2xl"
                      />
                    </View>
                  ) : null}

                  <Text className="pb-2 pt-5 font-sans text-xs text-muted">
                    {t("transactions.details.created", { date: dateLabel })}
                  </Text>
                </BottomSheetScrollView>

                <View
                  className="flex-row border-t border-border px-3 pt-2"
                  style={{ paddingBottom: Math.max(insets.bottom, 10) }}
                >
                  <Button
                    variant="ghost"
                    className="flex-1"
                    isDisabled={busy}
                    onPress={requestDelete}
                  >
                    <FilledIcon name="delete" size={22} tone="danger" />
                    <Button.Label className="text-danger">
                      {t("transactions.details.delete")}
                    </Button.Label>
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    isDisabled={busy}
                    onPress={edit}
                  >
                    <FilledIcon name="pencil" size={22} tone="accent" />
                    <Button.Label className="text-accent">
                      {t("transactions.details.edit")}
                    </Button.Label>
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    isDisabled={busy}
                    onPress={copy}
                  >
                    <FilledIcon name="copy" size={22} tone="accent" />
                    <Button.Label className="text-accent">
                      {t("transactions.details.copy")}
                    </Button.Label>
                  </Button>
                </View>
              </>
            )}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});