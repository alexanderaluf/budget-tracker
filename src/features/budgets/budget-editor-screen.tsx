import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { uuid } from "expo-modules-core";
import { Button } from "heroui-native";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
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
import { BudgetColorPicker } from "./components/budget-color-picker";
import {
  BudgetBadge,
  BudgetField,
  BudgetHeader,
  BudgetOption,
  BudgetSheet,
  BudgetToggle,
  TYPE_LABELS,
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
const titles: Record<Sheet, string> = {
  type: "Budget transaction type",
  mode: "Choose budget mode",
  scope: "Choose budget type",
  period: "Select budget period",
  categories: "Track categories",
  accounts: "Filter by accounts",
  settings: "Additional settings",
  icon: "Choose budget icon",
  color: "Budget color",
  currency: "Budget currency",
};
const toggleId = (values: string[], id: string) =>
  values.includes(id) ? values.filter((v) => v !== id) : [...values, id];

export function BudgetEditorScreen({ editId }: { editId?: string }) {
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
          : "Unable to save budget. Please try again.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  if (editId && !existing)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <BudgetHeader title="Budget unavailable" />
        <Text className="p-5 text-muted">
          This budget was removed or belongs to another profile.
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
      <BudgetHeader title={editId ? "Edit budget" : "Budget"} disabled={busy} />
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
              accessibilityLabel="Choose budget icon"
              disabled={busy}
              onPress={() => open("icon")}
            >
              <BudgetBadge budget={draft} />
            </Pressable>
            <View className="flex-1">
              <BudgetField
                editable={!busy}
                accessibilityLabel="Budget name"
                placeholder="Ex: Groceries"
                maxLength={100}
                value={draft.name}
                onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
              />
            </View>
          </View>
          <BudgetField
            editable={!busy}
            accessibilityLabel="Budget amount"
            placeholder="Enter amount"
            keyboardType="decimal-pad"
            value={draft.amount}
            onChangeText={(amount) => setDraft((d) => ({ ...d, amount }))}
          />
          {row(
            "type",
            "Budget for",
            "Choose the transactions this budget tracks",
            `Current: ${TYPE_LABELS[draft.transactionType]}`,
            "swap-horizontal",
          )}
          {row(
            "mode",
            "Budget mode",
            "Choose how categories are selected",
            `Current: ${draft.budgetMode}`,
            "tune",
          )}
          {row(
            "scope",
            "Budget type",
            "Choose how to track your budget",
            `Current: ${draft.budgetType} budget`,
            "wallet",
          )}
          {row(
            "period",
            "Budget period",
            "Select your budget timeframe",
            `Current: ${draft.period}${draft.period === "Monthly" && Number(draft.cycleDay) > 1 ? ` · starts on day ${draft.cycleDay}` : ""}`,
            "clock",
          )}
          {draft.budgetType === "Category" &&
            row(
              "categories",
              draft.budgetMode === "Automatic"
                ? "Auto-track categories"
                : "Select categories",
              draft.budgetMode === "Automatic"
                ? "Track selected categories and their subcategories"
                : "Choose categories to track together",
              `${draft.categories.length} selected`,
              "shopping",
            )}
          {row(
            "accounts",
            "Filter by accounts",
            "Only track transactions in these accounts",
            draft.accounts.length
              ? `${draft.accounts.length} selected`
              : "All accounts",
            "bank",
          )}
          {row(
            "currency",
            "Currency",
            "Track transactions in this currency",
            draft.currencyCode,
            "cash",
          )}
          {row(
            "settings",
            "Additional settings",
            "Rolling budget and home-screen visibility",
            draft.rolling ? "Rolling budget" : "Fixed budget",
            "cog",
          )}
          <BudgetField
            editable={!busy}
            accessibilityLabel="Budget notes"
            placeholder="Notes"
            multiline
            maxLength={2000}
            value={draft.notes}
            onChangeText={(notes) => setDraft((d) => ({ ...d, notes }))}
            style={{ minHeight: 120, textAlignVertical: "top", marginTop: 12 }}
          />
          {row(
            "color",
            "Colors",
            "Choose a color for this budget",
            draft.color,
            "format-paint",
          )}
          <View className="flex-row flex-wrap gap-2">
            {ICON_COLORS.slice(0, 10).map((color) => (
              <Pressable
                key={color}
                accessibilityRole="button"
                accessibilityLabel={`Choose color ${color}`}
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
              {busy ? "Saving…" : editId ? "Save budget" : "Add budget"}
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
            TYPE_LABELS.map((label, index) => (
              <BudgetOption
                key={label}
                title={`${label} budget`}
                description={
                  index === 0
                    ? "Track spending against a budget limit"
                    : index === 1
                      ? "Track income against an earning goal"
                      : "Track transfers against a movement target"
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
                  title={mode}
                  description={
                    mode === "Automatic"
                      ? "Selected categories automatically include existing and future subcategories."
                      : "Choose exact categories, with an optional subcategory roll-up."
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
                  title={`${scope} budget`}
                  description={
                    scope === "Category"
                      ? "Track the categories you choose. Create as many independent budgets as you need, including multiple budgets for the same category."
                      : "Track all categories with one total limit, including uncategorized transactions."
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
                  title={period}
                  description={
                    period === "Custom"
                      ? "Set your own date range"
                      : `Resets ${period.toLowerCase()}`
                  }
                  selected={pending.period === period}
                  onPress={() => change("period", period)}
                />
              ))}
              {pending.period === "Monthly" && (
                <>
                  <Text className="mt-3 font-manrope-semibold text-lg text-foreground">
                    Custom monthly cycle
                  </Text>
                  <BudgetField
                    accessibilityLabel="Start day of month"
                    placeholder="Start day of month (1–31)"
                    keyboardType="number-pad"
                    value={pending.cycleDay}
                    maxLength={2}
                    onChangeText={(v) => change("cycleDay", v)}
                  />
                  <Text className="text-sm text-muted">
                    Shorter months use their last day. Leave empty to start on
                    the 1st.
                  </Text>
                </>
              )}
              {pending.period === "Custom" && (
                <>
                  <BudgetField
                    accessibilityLabel="Budget start date"
                    placeholder="Start date · YYYY-MM-DD"
                    value={pending.startDate}
                    onChangeText={(v) => change("startDate", v)}
                  />
                  <BudgetField
                    accessibilityLabel="Budget end date"
                    placeholder="End date · YYYY-MM-DD"
                    value={pending.endDate}
                    onChangeText={(v) => change("endDate", v)}
                  />
                  <Text className="text-sm text-muted">
                    Both dates are included.
                  </Text>
                </>
              )}
            </>
          )}
          {sheet === "categories" && (
            <>
              <Text className="text-muted">
                {pending.categories.length} of {categories.length} selected
              </Text>
              <BudgetField
                accessibilityLabel="Search categories"
                placeholder="Search categories"
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
                        ? `Subcategory · ${categories.find((p) => p.id === cat.parentId)?.name ?? "Parent category"}`
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
                  No {TYPE_LABELS[pending.transactionType].toLowerCase()}{" "}
                  categories yet. Create one from Profile → Categories.
                </Text>
              )}
              {pending.budgetMode === "Manual" ? (
                <BudgetToggle
                  title="Include subcategories"
                  description="Roll up descendants of selected categories"
                  value={pending.includeSubcategories}
                  onChange={(v) => change("includeSubcategories", v)}
                />
              ) : (
                <Text className="py-3 text-muted">
                  Automatic mode includes descendants of your selected
                  categories.
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
                  Select all
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => change("categories", [])}
                >
                  Clear all
                </Button>
              </View>
            </>
          )}
          {sheet === "accounts" && (
            <>
              <Text className="text-muted">
                {pending.accounts.length} / {accounts.length} · None selected
                means all accounts
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
                  Select all
                </Button>
                <Button variant="ghost" onPress={() => change("accounts", [])}>
                  Clear all
                </Button>
              </View>
            </>
          )}
          {sheet === "settings" && (
            <>
              <BudgetToggle
                title="Rolling budget"
                description={
                  pending.period === "Custom"
                    ? "Available for repeating periods only"
                    : "Unused amount carries forward from the creation period. Overspending reduces the carry to zero."
                }
                disabled={pending.period === "Custom"}
                value={pending.rolling}
                onChange={(v) => change("rolling", v)}
              />
              <BudgetToggle
                title="Show budget"
                description="Track this budget on the home screen"
                value={pending.showOnHome}
                onChange={(v) => change("showOnHome", v)}
              />
            </>
          )}
          {sheet === "currency" && (
            <>
              <BudgetField
                accessibilityLabel="Search currencies"
                placeholder="Search currencies"
                value={query}
                onChangeText={setQuery}
              />
              <Text className="text-sm text-muted">
                Only transactions in this currency contribute to this budget.
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
                accessibilityLabel="Search budget icons"
                placeholder="Search icons"
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
                Search to find more icons.
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
