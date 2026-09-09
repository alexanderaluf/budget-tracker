import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { uuid } from "expo-modules-core";
import { Button } from "heroui-native";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalData } from "@/data/local-data-provider";
import {
  BUDGET_PERIODS,
  budgetDefaults,
  saveBudget,
  type BudgetDraft,
} from "@/data/model/budget-record";
import { identity, references } from "@/data/model/category-record";
import {
  selectBudgetCurrency,
  selectBudgetDraft,
} from "@/data/selectors/budget-selectors";
import {
  selectAccounts,
  selectCategories,
} from "@/data/selectors/document-selectors";
import { currencies } from "@/features/profile/data/currencies-data";
import { ICON_COLORS } from "@/shared/icons/colors";
import { MATERIAL_ROUNDED_FILLED_ICONS } from "@/shared/icons/material-rounded-filled-icons";
import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";
import { RecordIcon } from "@/shared/ui/record-icon";
import { useAppThemeColors } from "@/shared/theme/app-theme";
import { Text } from "@/shared/ui/app-text";
import { BudgetColorPicker } from "./components/budget-color-picker";
import {
  BudgetBadge,
  BudgetField,
  BudgetHeader,
  BudgetOption,
  BudgetSheet,
  BudgetToggle,
  useBudgetLabels,
} from "./components/budget-ui";

type Sheet =
  | "type"
  | "mode"
  | "scope"
  | "period"
  | "categories"
  | "accounts"
  | "settings"
  | "icon"
  | "color"
  | "currency";
const toggleId = (values: string[], id: string) =>
  values.includes(id) ? values.filter((v) => v !== id) : [...values, id];

export function BudgetEditorScreen({ editId }: { editId?: string }) {
  const { t, i18n } = useTranslation();
  const labels = useBudgetLabels();
  const { document, updateDocument } = useLocalData();
  const router = useRouter(),
    insets = useSafeAreaInsets(),
    c = useAppThemeColors();
  const existing = editId ? selectBudgetDraft(document, editId) : null;
  const [draft, setDraft] = useState<BudgetDraft>(() =>
    existing
      ? existing
      : { ...budgetDefaults(), currencyCode: selectBudgetCurrency(document) },
  );
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [pending, setPending] = useState(draft);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false),
    id = useRef(editId ?? uuid.v4());
  const categories = selectCategories(document).filter(
    (cat) => cat.type === pending.transactionType,
  );
  const accounts = selectAccounts(document);
  const titles: Record<Sheet, string> = {
    type: t("budgets.form.sheetTitles.type"),
    mode: t("budgets.form.sheetTitles.mode"),
    scope: t("budgets.form.sheetTitles.scope"),
    period: t("budgets.form.sheetTitles.period"),
    categories: t("budgets.form.sheetTitles.categories"),
    accounts: t("budgets.form.sheetTitles.accounts"),
    settings: t("budgets.form.sheetTitles.settings"),
    icon: t("budgets.form.sheetTitles.icon"),
    color: t("budgets.form.sheetTitles.color"),
    currency: t("budgets.form.sheetTitles.currency"),
  };
  const change = <K extends keyof BudgetDraft>(key: K, value: BudgetDraft[K]) =>
    setPending((d) => ({ ...d, [key]: value }));
  function open(value: Sheet) {
    setPending({ ...draft });
    setQuery("");
    setSheet(value);
  }
  function apply() {
    setDraft(pending);
    setSheet(null);
  }
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await updateDocument((current) =>
        saveBudget(
          current,
          draft,
          id.current,
          new Date().toISOString(),
          !!editId,
        ),
      );
      router.replace({ pathname: "/budgets/[id]", params: { id: id.current } });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t("budgets.form.saveError"),
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  if (editId && !existing)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <BudgetHeader title={t("budgets.form.unavailableTitle")} />
        <Text className="p-5 text-muted">
          {t("budgets.form.unavailableDescription")}
        </Text>
      </SafeAreaView>
    );
  const row = (
    key: Sheet,
    title: string,
    description: string,
    current: string,
    icon: FilledIconName,
  ) => (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={() => open(key)}
      className="flex-row items-center gap-4 py-4"
    >
      <FilledIcon name={icon} size={26} tone="accent" />
      <View className="flex-1">
        <Text className="font-manrope-semibold text-lg text-foreground">
          {title}
        </Text>
        <Text className="mt-1 text-base leading-6 text-muted">
          {description}
        </Text>
        <Text className="text-sm leading-6 text-muted">{current}</Text>
      </View>
      <FilledIcon name="chevron-right" size={24} />
    </Pressable>
  );
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <BudgetHeader
        title={editId ? t("budgets.form.editTitle") : t("budgets.form.title")}
        disabled={busy}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 24,
          }}
        >
          <View className="mb-4 flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("budgets.form.chooseIcon")}
              disabled={busy}
              onPress={() => open("icon")}
            >
              <BudgetBadge budget={draft} />
            </Pressable>
            <View className="flex-1">
              <BudgetField
                editable={!busy}
                accessibilityLabel={t("budgets.form.name")}
                placeholder={t("budgets.form.namePlaceholder")}
                maxLength={100}
                value={draft.name}
                onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
              />
            </View>
          </View>
          <BudgetField
            editable={!busy}
            accessibilityLabel={t("budgets.form.amount")}
            placeholder={t("budgets.form.amountPlaceholder")}
            keyboardType="decimal-pad"
            value={draft.amount}
            onChangeText={(amount) => setDraft((d) => ({ ...d, amount }))}
          />
          {row(
            "type",
            t("budgets.form.budgetFor"),
            t("budgets.form.budgetForHelp"),
            t("budgets.common.current", {
              value: labels.types[draft.transactionType],
            }),
            "swap-horizontal",
          )}
          {row(
            "mode",
            t("budgets.form.mode"),
            t("budgets.form.modeHelp"),
            t("budgets.common.current", {
              value: labels.modes[draft.budgetMode],
            }),
            "tune",
          )}
          {row(
            "scope",
            t("budgets.form.scope"),
            t("budgets.form.scopeHelp"),
            t("budgets.common.current", {
              value: t("budgets.common.typeBudget", {
                type: labels.scopes[draft.budgetType],
              }),
            }),
            "wallet",
          )}
          {row(
            "period",
            t("budgets.form.period"),
            t("budgets.form.periodHelp"),
            draft.period === "Monthly" && Number(draft.cycleDay) > 1
              ? t("budgets.common.currentMonthlyCycle", {
                  period: labels.periods[draft.period],
                  day: draft.cycleDay,
                })
              : t("budgets.common.current", {
                  value: labels.periods[draft.period],
                }),
            "clock",
          )}
          {draft.budgetType === "Category" &&
            row(
              "categories",
              draft.budgetMode === "Automatic"
                ? t("budgets.form.autoTrackCategories")
                : t("budgets.form.selectCategories"),
              draft.budgetMode === "Automatic"
                ? t("budgets.form.autoTrackCategoriesHelp")
                : t("budgets.form.selectCategoriesHelp"),
              t("budgets.common.selected", {
                count: draft.categories.length,
              }),
              "shopping",
            )}
          {row(
            "accounts",
            t("budgets.form.filterAccounts"),
            t("budgets.form.filterAccountsHelp"),
            draft.accounts.length
              ? t("budgets.common.selected", { count: draft.accounts.length })
              : t("budgets.common.allAccounts"),
            "bank",
          )}
          {row(
            "currency",
            t("budgets.form.currency"),
            t("budgets.form.currencyHelp"),
            draft.currencyCode,
            "cash",
          )}
          {row(
            "settings",
            t("budgets.form.additionalSettings"),
            t("budgets.form.additionalSettingsHelp"),
            draft.rolling
              ? t("budgets.common.rollingBudget")
              : t("budgets.common.fixedBudget"),
            "cog",
          )}
          <BudgetField
            editable={!busy}
            accessibilityLabel={t("budgets.form.notes")}
            placeholder={t("budgets.form.notesPlaceholder")}
            multiline
            maxLength={2000}
            value={draft.notes}
            onChangeText={(notes) => setDraft((d) => ({ ...d, notes }))}
            style={{ minHeight: 120, textAlignVertical: "top", marginTop: 12 }}
          />
          {row(
            "color",
            t("budgets.form.colors"),
            t("budgets.form.colorsHelp"),
            draft.color,
            "format-paint",
          )}
          <View className="flex-row flex-wrap gap-2">
            {ICON_COLORS.slice(0, 10).map((color) => (
              <Pressable
                key={color}
                accessibilityRole="button"
                accessibilityLabel={t("budgets.form.chooseColor", { color })}
                accessibilityState={{ selected: draft.color === color }}
                disabled={busy}
                onPress={() => setDraft((d) => ({ ...d, color }))}
                style={{
                  backgroundColor: color,
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {draft.color === color && (
                  <FilledIcon name="check" size={20} color="#000" />
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View
          className="gap-2 border-t border-border bg-background px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          {!!error && (
            <Text accessibilityRole="alert" className="text-danger">
              {error}
            </Text>
          )}
          <Button
            isDisabled={busy}
            accessibilityState={{ busy }}
            className="h-14 rounded-full"
            onPress={save}
          >
            <FilledIcon name="wallet" size={24} tone="accent-foreground" />
            <Button.Label>
              {busy
                ? t("budgets.form.saving")
                : editId
                  ? t("budgets.form.save")
                  : t("budgets.form.add")}
            </Button.Label>
          </Button>
        </View>
      </KeyboardAvoidingView>
      {sheet && (
        <BudgetSheet
          title={titles[sheet]}
          onClose={() => setSheet(null)}
          onDone={apply}
        >
          {sheet === "type" &&
            labels.types.map((label, index) => (
              <BudgetOption
                key={label}
                title={t("budgets.common.typeBudget", { type: label })}
                description={
                  index === 0
                    ? t("budgets.form.typeDescriptions.expense")
                    : index === 1
                      ? t("budgets.form.typeDescriptions.income")
                      : t("budgets.form.typeDescriptions.transfer")
                }
                selected={pending.transactionType === index}
                onPress={() =>
                  setPending((d) => ({
                    ...d,
                    transactionType: index as 0 | 1 | 2,
                    categories: d.transactionType === index ? d.categories : [],
                  }))
                }
              />
            ))}
          {sheet === "mode" && (
            <>
              {(["Automatic", "Manual"] as const).map((mode) => (
                <BudgetOption
                  key={mode}
                  title={labels.modes[mode]}
                  description={
                    mode === "Automatic"
                      ? t("budgets.form.modeDescriptions.automatic")
                      : t("budgets.form.modeDescriptions.manual")
                  }
                  selected={pending.budgetMode === mode}
                  onPress={() => change("budgetMode", mode)}
                />
              ))}
            </>
          )}
          {sheet === "scope" && (
            <>
              {(["Category", "Overall"] as const).map((scope) => (
                <BudgetOption
                  key={scope}
                  title={t("budgets.common.typeBudget", {
                    type: labels.scopes[scope],
                  })}
                  description={
                    scope === "Category"
                      ? t("budgets.form.scopeDescriptions.category")
                      : t("budgets.form.scopeDescriptions.overall")
                  }
                  selected={pending.budgetType === scope}
                  onPress={() => change("budgetType", scope)}
                />
              ))}
            </>
          )}
          {sheet === "period" && (
            <>
              {BUDGET_PERIODS.map((period) => (
                <BudgetOption
                  key={period}
                  title={labels.periods[period]}
                  description={
                    period === "Custom"
                      ? t("budgets.form.customDateRange")
                      : t("budgets.form.resets", {
                          period: labels.periods[period].toLocaleLowerCase(
                            i18n.resolvedLanguage,
                          ),
                        })
                  }
                  selected={pending.period === period}
                  onPress={() => change("period", period)}
                />
              ))}
              {pending.period === "Monthly" && (
                <>
                  <Text className="mt-3 font-manrope-semibold text-lg text-foreground">
                    {t("budgets.form.customMonthlyCycle")}
                  </Text>
                  <BudgetField
                    accessibilityLabel={t("budgets.form.startDay")}
                    placeholder={t("budgets.form.startDayPlaceholder")}
                    keyboardType="number-pad"
                    value={pending.cycleDay}
                    maxLength={2}
                    onChangeText={(v) => change("cycleDay", v)}
                  />
                  <Text className="text-sm text-muted">
                    {t("budgets.form.shorterMonths")}
                  </Text>
                </>
              )}
              {pending.period === "Custom" && (
                <>
                  <BudgetField
                    accessibilityLabel={t("budgets.form.startDate")}
                    placeholder={t("budgets.form.startDatePlaceholder")}
                    value={pending.startDate}
                    onChangeText={(v) => change("startDate", v)}
                  />
                  <BudgetField
                    accessibilityLabel={t("budgets.form.endDate")}
                    placeholder={t("budgets.form.endDatePlaceholder")}
                    value={pending.endDate}
                    onChangeText={(v) => change("endDate", v)}
                  />
                  <Text className="text-sm text-muted">
                    {t("budgets.form.datesIncluded")}
                  </Text>
                </>
              )}
            </>
          )}
          {sheet === "categories" && (
            <>
              <Text className="text-muted">
                {t("budgets.form.categorySelection", {
                  selected: pending.categories.length,
                  total: categories.length,
                })}
              </Text>
              <BudgetField
                accessibilityLabel={t("budgets.form.searchCategories")}
                placeholder={t("budgets.form.searchCategories")}
                value={query}
                onChangeText={setQuery}
              />
              {categories
                .filter((cat) =>
                  cat.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((cat) => (
                  <BudgetOption
                    key={cat.id}
                    title={cat.name}
                    description={
                      cat.parentId
                        ? t("budgets.form.subcategory", {
                            parent:
                              categories.find((p) => p.id === cat.parentId)
                                ?.name ?? t("budgets.form.parentCategory"),
                          })
                        : undefined
                    }
                    selected={pending.categories.some((id) =>
                      references(
                        document.categories.find(
                          (r) => identity(r) === cat.id,
                        )!,
                        id,
                      ),
                    )}
                    onPress={() =>
                      change("categories", toggleId(pending.categories, cat.id))
                    }
                  >
                    <BudgetBadge budget={cat} />
                  </BudgetOption>
                ))}
              {!categories.length && (
                <Text className="py-4 text-muted">
                  {t("budgets.form.noCategories", {
                    type: labels.types[
                      pending.transactionType
                    ].toLocaleLowerCase(i18n.resolvedLanguage),
                  })}
                </Text>
              )}
              {pending.budgetMode === "Manual" ? (
                <BudgetToggle
                  title={t("budgets.form.includeSubcategories")}
                  description={t("budgets.form.includeSubcategoriesHelp")}
                  value={pending.includeSubcategories}
                  onChange={(v) => change("includeSubcategories", v)}
                />
              ) : (
                <Text className="py-3 text-muted">
                  {t("budgets.form.automaticIncludesDescendants")}
                </Text>
              )}
              <View className="flex-row gap-3">
                <Button
                  variant="secondary"
                  onPress={() =>
                    change(
                      "categories",
                      categories.map((cat) => cat.id),
                    )
                  }
                >
                  {t("budgets.form.selectAll")}
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => change("categories", [])}
                >
                  {t("budgets.form.clearAll")}
                </Button>
              </View>
            </>
          )}
          {sheet === "accounts" && (
            <>
              <Text className="text-muted">
                {t("budgets.form.accountSelection", {
                  selected: pending.accounts.length,
                  total: accounts.length,
                })}
              </Text>
              {accounts.map((a) => (
                <BudgetOption
                  key={a.id}
                  title={a.name}
                  description={`${a.ownerName} · ${a.currencyCode}`}
                  selected={pending.accounts.includes(a.id)}
                  onPress={() =>
                    change("accounts", toggleId(pending.accounts, a.id))
                  }
                  icon="bank"
                />
              ))}
              <View className="flex-row gap-3">
                <Button
                  variant="secondary"
                  onPress={() =>
                    change(
                      "accounts",
                      accounts.map((a) => a.id),
                    )
                  }
                >
                  {t("budgets.form.selectAll")}
                </Button>
                <Button variant="ghost" onPress={() => change("accounts", [])}>
                  {t("budgets.form.clearAll")}
                </Button>
              </View>
            </>
          )}
          {sheet === "settings" && (
            <>
              <BudgetToggle
                title={t("budgets.common.rollingBudget")}
                description={
                  pending.period === "Custom"
                    ? t("budgets.form.rollingCustomHelp")
                    : t("budgets.form.rollingHelp")
                }
                disabled={pending.period === "Custom"}
                value={pending.rolling}
                onChange={(v) => change("rolling", v)}
              />
              <BudgetToggle
                title={t("budgets.form.showBudget")}
                description={t("budgets.form.showBudgetHelp")}
                value={pending.showOnHome}
                onChange={(v) => change("showOnHome", v)}
              />
            </>
          )}
          {sheet === "currency" && (
            <>
              <BudgetField
                accessibilityLabel={t("budgets.form.searchCurrencies")}
                placeholder={t("budgets.form.searchCurrencies")}
                value={query}
                onChangeText={setQuery}
              />
              <Text className="text-sm text-muted">
                {t("budgets.form.currencyContribution")}
              </Text>
              {currencies
                .filter((v) =>
                  `${v.code} ${v.name}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((v) => (
                  <BudgetOption
                    key={v.code}
                    title={`${v.code.toUpperCase()} · ${v.name}`}
                    selected={pending.currencyCode === v.code.toUpperCase()}
                    onPress={() => change("currencyCode", v.code.toUpperCase())}
                  />
                ))}
            </>
          )}
          {sheet === "icon" && (
            <>
              <BudgetField
                accessibilityLabel={t("budgets.form.searchBudgetIcons")}
                placeholder={t("budgets.form.searchIcons")}
                value={query}
                onChangeText={setQuery}
              />
              <View className="flex-row flex-wrap gap-2">
                {MATERIAL_ROUNDED_FILLED_ICONS.filter((i) =>
                  i.searchText.includes(query.toLowerCase()),
                )
                  .slice(0, 180)
                  .map((i) => (
                    <Pressable
                      key={i.name}
                      accessibilityRole="button"
                      accessibilityLabel={i.label}
                      accessibilityState={{
                        selected: pending.icon === `material:${i.name}`,
                      }}
                      onPress={() =>
                        setPending((d) => ({
                          ...d,
                          icon: `material:${i.name}`,
                          iconPath: i.pathData,
                        }))
                      }
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        backgroundColor: c.surface,
                        borderWidth: 2,
                        borderColor:
                          pending.icon === `material:${i.name}`
                            ? c.accent
                            : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <RecordIcon
                        name={`material:${i.name}`}
                        pathData={i.pathData}
                        color={c.foreground}
                        size={27}
                      />
                    </Pressable>
                  ))}
              </View>
              <Text className="text-sm text-muted">
                {t("budgets.form.searchMoreIcons")}
              </Text>
            </>
          )}
          {sheet === "color" && (
            <BudgetColorPicker
              value={pending.color}
              onChange={(v) => change("color", v)}
            />
          )}
        </BudgetSheet>
      )}
    </SafeAreaView>
  );
}
