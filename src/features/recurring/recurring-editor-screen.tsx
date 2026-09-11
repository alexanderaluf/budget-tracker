import DateTimePicker from "@react-native-community/datetimepicker";
import { uuid } from "expo-modules-core";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, View } from "react-native";
import { useLocalData } from "@/data/local-data-provider";
import { requestRecurringReminderPermission } from "@/data/recurring/recurring-reminders";
import {
  RECURRING_PERIODS,
  recurringDefaults,
  saveRecurring,
  type RecurringDraft,
} from "@/data/model/recurring-record";
import {
  selectAccounts,
  selectCategories,
  selectRecurrings,
  selectRecurringRelations,
} from "@/data/selectors/document-selectors";
import {
  BudgetField,
  BudgetOption,
  BudgetSheet,
  BudgetToggle,
} from "@/features/budgets/components/budget-ui";
import { BudgetColorPicker } from "@/features/budgets/components/budget-color-picker";
import { CurrencySelectorSheet } from "@/features/profile/components/currency-selector-sheet";
import { currencies } from "@/features/profile/data/currencies-data";
import { useProfiles } from "@/features/profile/profile-provider";
import { TransactionSelectionSection } from "@/features/transactions/components/transaction-selection-section";
import { useAppThemeColors } from "@/shared/theme/app-theme";
import { IconPicker } from "@/shared/ui/icon-picker";
import { Text } from "@/shared/ui/app-text";
import { FilledIcon } from "@/shared/ui/filled-icon";
import {
  RecurringAction,
  RecurringBadge,
  RecurringEditorShell,
} from "./components/recurring-ui";

export function RecurringEditorScreen({ editId }: { editId?: string }) {
  const { document, updateDocument, reconcileRecurringPayments } =
      useLocalData(),
    { activeProfile } = useProfiles(),
    router = useRouter(),
    c = useAppThemeColors(),
    { t, i18n } = useTranslation();
  const existing = editId
    ? selectRecurrings(document).find((r) => r.id === editId)
    : null;
  const [draft, setDraft] = useState<RecurringDraft>(
    () =>
      existing?.draft ?? {
        ...recurringDefaults(),
        currencyCode: activeProfile.currencyCode,
      },
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [expanded, setExpanded] = useState("account");
  const [sheet, setSheet] = useState<
    "period" | "currency" | "icon" | "reminder" | null
  >(null);
  const [datePicker, setDatePicker] = useState<"start" | "time" | "end" | null>(
    null,
  );
  const saving = useRef(false),
    id = useRef(editId ?? uuid.v4());
  const accounts = selectAccounts(document),
    categories = selectCategories(document);
  const change = <K extends keyof RecurringDraft>(
    key: K,
    value: RecurringDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  const back = () =>
    router.canGoBack() ? router.back() : router.replace("/recurring");
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await updateDocument((current) =>
        saveRecurring(
          current,
          draft,
          id.current,
          activeProfile.id,
          new Date().toISOString(),
          !!editId,
        ),
      );
      // Catch-up is awaited by its provider and reports errors without undoing the saved schedule.
      await reconcileRecurringPayments().catch(() => undefined);
      back();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("recurring.error"));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const relations = [
    {
      key: "account",
      icon: "wallet",
      options: accounts.map((a) => ({
        id: a.id,
        name: `${a.name} · ${a.currencyCode}`,
        icon: a.icon,
        iconPath: a.iconPath,
        color: a.color,
      })),
    },
    {
      key: "category",
      icon: "shopping",
      options: categories
        .filter(
          (a) =>
            a.type === draft.type &&
            !categories.some((child) => child.parentId === a.id),
        )
        .map((a) => ({
          id: a.id,
          name: a.parentId
            ? `${categories.find((p) => p.id === a.parentId)?.name ?? ""} / ${a.name}`
            : a.name,
          icon: a.icon,
          iconPath: a.iconPath,
          color: a.color,
        })),
    },
    {
      key: "budget",
      icon: "piggy-bank",
      options: selectRecurringRelations(document, "budgets"),
    },
    {
      key: "label",
      icon: "shopping",
      options: selectRecurringRelations(document, "labels"),
    },
    {
      key: "place",
      icon: "home",
      options: selectRecurringRelations(document, "places"),
    },
    {
      key: "person",
      icon: "account",
      options: selectRecurringRelations(document, "peoples"),
    },
  ] as const;
  return (
    <>
      <RecurringEditorShell
        title={t(editId ? "recurring.edit" : "recurring.create")}
        value={draft.type}
        options={[
          { label: t("recurring.expense"), value: 0 },
          { label: t("recurring.income"), value: 1 },
        ]}
        busy={busy}
        onChange={(value) =>
          setDraft((d) => ({ ...d, type: value === 1 ? 1 : 0, category: "" }))
        }
        onBack={back}
        bottomOverlay={
          <RecurringAction
            label={t(
              busy
                ? "recurring.processing"
                : editId
                  ? "recurring.update"
                  : "recurring.save",
            )}
            busy={busy || (!!editId && !existing)}
            error={error}
            onPress={save}
          />
        }
      >
        {!!editId && !existing ? (
          <Text className="text-danger">{t("recurring.missing")}</Text>
        ) : (
          <>
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("recurring.icon")}
                onPress={() => setSheet("icon")}
              >
                <RecurringBadge item={draft} />
              </Pressable>
              <BudgetField
                accessibilityLabel={t("recurring.name")}
                placeholder={t("recurring.name")}
                value={draft.name}
                maxLength={100}
                onChangeText={(v) => change("name", v)}
                style={{ flex: 1 }}
              />
            </View>
            <BudgetField
              accessibilityLabel={t("recurring.amount")}
              placeholder={t("recurring.amount")}
              value={draft.amount}
              keyboardType="decimal-pad"
              onChangeText={(v) => change("amount", v)}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setSheet("currency")}
              className="flex-row items-center gap-3 rounded-2xl bg-surface p-4"
            >
              <FilledIcon name="currency-exchange" tone="accent" size={24} />
              <View className="flex-1">
                <Text className="text-muted">{t("recurring.currency")}</Text>
                <Text className="font-manrope-semibold text-lg text-foreground">
                  {draft.currencyCode} ·{" "}
                  {currencies.find((v) => v.code === draft.currencyCode)?.name}
                </Text>
              </View>
              <FilledIcon name="chevron-right" size={24} />
            </Pressable>
            {draft.currencyCode !== activeProfile.currencyCode && (
              <Text className="text-sm leading-5 text-muted">
                {t("recurring.currencyHint", {
                  currency: activeProfile.currencyCode,
                })}
              </Text>
            )}
            <View className="flex-row gap-3">
              {(["start", "time"] as const).map((key) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  onPress={() => setDatePicker(key)}
                  className="flex-1 gap-1 rounded-2xl bg-surface p-4"
                >
                  <Text className="text-sm text-muted">
                    {t(`recurring.${key}`)}
                  </Text>
                  <Text className="font-manrope-semibold text-base text-foreground">
                    {key === "start"
                      ? new Date(draft.startAt).toLocaleDateString(
                          i18n.resolvedLanguage,
                        )
                      : new Date(draft.startAt).toLocaleTimeString(
                          i18n.resolvedLanguage,
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSheet("period")}
              className="flex-row items-center gap-4 border-b border-border py-4"
            >
              <FilledIcon name="swap-horizontal" tone="accent" size={26} />
              <View className="flex-1">
                <Text className="font-manrope-semibold text-lg text-foreground">
                  {t("recurring.period")}
                </Text>
                <Text className="text-muted">
                  {t(`recurring.periods.${draft.period}`)}
                </Text>
              </View>
              <FilledIcon name="chevron-right" size={24} />
            </Pressable>
            {relations.map((relation) => (
              <TransactionSelectionSection
                key={relation.key}
                title={t(`recurring.${relation.key}`)}
                placeholder={t("recurring.select", {
                  name: t(`recurring.${relation.key}`),
                })}
                icon={relation.icon}
                selectedId={draft[relation.key]}
                options={relation.options}
                expanded={expanded === relation.key}
                onToggle={() =>
                  setExpanded(expanded === relation.key ? "" : relation.key)
                }
                onSelect={(value) => change(relation.key, value)}
                optional={relation.key !== "account"}
                onAdd={
                  relation.key === "account"
                    ? () => router.push("/accounts/create")
                    : relation.key === "category"
                      ? () => router.push("/categories/create")
                      : undefined
                }
              />
            ))}
            <BudgetToggle
              title={t("recurring.automatic")}
              description={t("recurring.automaticHint")}
              value={draft.automatic}
              onChange={(v) => change("automatic", v)}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setSheet("reminder")}
              className="flex-row items-center gap-4 border-b border-border py-4"
            >
              <FilledIcon name="bell" tone="accent" size={26} />
              <View className="flex-1 gap-1">
                <Text className="font-manrope-semibold text-lg text-foreground">
                  {t("recurring.reminder")}
                </Text>
                <Text className="text-muted">
                  {t(
                    draft.reminderDays === null
                      ? "recurring.noReminder"
                      : draft.reminderDays === 0
                        ? "recurring.reminderAt"
                        : "recurring.reminderBefore",
                    { count: draft.reminderDays ?? 0 },
                  )}
                </Text>
              </View>
              <FilledIcon name="chevron-right" size={24} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDatePicker("end")}
              className="gap-1 border-b border-border py-4"
            >
              <Text className="font-manrope-semibold text-lg text-foreground">
                {t("recurring.end")}
              </Text>
              <Text className="text-muted">
                {draft.endAt
                  ? new Date(draft.endAt).toLocaleDateString(
                      i18n.resolvedLanguage,
                    )
                  : t("recurring.noEnd")}
              </Text>
            </Pressable>
            {draft.endAt && (
              <Pressable
                accessibilityRole="button"
                onPress={() => change("endAt", null)}
              >
                <Text className="text-accent">{t("recurring.noEnd")}</Text>
              </Pressable>
            )}
            <BudgetField
              accessibilityLabel={t("recurring.description")}
              placeholder={t("recurring.description")}
              value={draft.description}
              onChangeText={(v) => change("description", v)}
              multiline
            />
            <Text className="font-manrope-semibold text-lg text-foreground">
              {t("recurring.colors")}
            </Text>
            <BudgetColorPicker
              value={draft.color}
              onChange={(v) => change("color", v)}
            />
            <Text className="text-sm leading-5 text-muted">
              {t("recurring.scheduleHint")}
            </Text>
          </>
        )}
      </RecurringEditorShell>
      <CurrencySelectorSheet
        currencies={currencies}
        isOpen={sheet === "currency"}
        selectedCode={draft.currencyCode}
        onOpenChange={(open) => !open && setSheet(null)}
        onSelect={(v) => {
          change("currencyCode", v.code);
          setSheet(null);
        }}
      />
      {sheet === "icon" && (
        <IconPicker
          selected={{ name: draft.icon, pathData: draft.iconPath }}
          onSelect={(v) => {
            setDraft((d) => ({
              ...d,
              icon: v.name,
              iconPath: v.pathData ?? null,
            }));
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "period" && (
        <BudgetSheet
          title={t("recurring.period")}
          onClose={() => setSheet(null)}
        >
          {RECURRING_PERIODS.map((p) => (
            <BudgetOption
              key={p}
              title={t(`recurring.periods.${p}`)}
              selected={draft.period === p}
              onPress={() => {
                change("period", p);
                setSheet(null);
              }}
            />
          ))}
        </BudgetSheet>
      )}
      {sheet === "reminder" && (
        <BudgetSheet
          title={t("recurring.reminder")}
          onClose={() => setSheet(null)}
        >
          {[null, 0, 1, 2, 7].map((days) => (
            <BudgetOption
              key={String(days)}
              title={t(
                days === null
                  ? "recurring.noReminder"
                  : days === 0
                    ? "recurring.reminderAt"
                    : "recurring.reminderBefore",
                { count: days ?? 0 },
              )}
              selected={draft.reminderDays === days}
              onPress={() => {
                setSheet(null);
                void (async () => {
                  try {
                    if (days !== null)
                      await requestRecurringReminderPermission();
                    change("reminderDays", days);
                  } catch (reason) {
                    setError(
                      reason instanceof Error
                        ? reason.message
                        : t("recurring.error"),
                    );
                  }
                })();
              }}
            />
          ))}
        </BudgetSheet>
      )}
      {!!datePicker && (
        <BudgetSheet
          title={t(`recurring.${datePicker}`)}
          onClose={() => setDatePicker(null)}
          onDone={() => setDatePicker(null)}
        >
          <DateTimePicker
            value={
              new Date(
                datePicker === "end"
                  ? (draft.endAt ?? draft.startAt)
                  : draft.startAt,
              )
            }
            mode={datePicker === "time" ? "time" : "date"}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            themeVariant={c.isDark ? "dark" : "light"}
            onChange={(event, value) => {
              if (event.type === "set" && value)
                change(
                  datePicker === "end" ? "endAt" : "startAt",
                  value.toISOString(),
                );
              if (Platform.OS !== "ios") setDatePicker(null);
            }}
          />
        </BudgetSheet>
      )}
    </>
  );
}
