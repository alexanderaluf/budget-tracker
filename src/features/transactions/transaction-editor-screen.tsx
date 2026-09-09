import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { BlurTargetView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { uuid } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BottomSheet, Button, Input } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  deleteAttachment,
  getAttachmentFile,
  persistAttachment,
} from "@/data/attachments/attachment-store";
import { useLocalData } from "@/data/local-data-provider";
import {
  belongsToProfile,
  identity,
} from "@/data/model/category-record";
import type { JsonObject } from "@/data/model/json";
import {
  createTransactionDraft,
  saveTransaction,
  saveTransactionTemplate,
  transactionDraftFromRecord,
  type TransactionDraft,
  type TransactionType,
} from "@/data/model/transaction-record";
import {
  selectAccounts,
  selectBudgets,
  selectCategories,
} from "@/data/selectors/document-selectors";
import { useProfiles } from "@/features/profile/profile-provider";
import { colorWithAlpha, useAppThemeColors } from "@/shared/theme/app-theme";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { GlassSegmentedControl } from "@/shared/ui/glass-segmented-control";

import {
  TransactionSelectionSection,
  type TransactionOption,
} from "./components/transaction-selection-section";
import { TransactionCategorySheet } from "./components/transaction-category-sheet";

const TYPE_OPTIONS = [
  { label: "Expense", value: 0 as const },
  { label: "Income", value: 1 as const },
  { label: "Transfer", value: 2 as const },
];

type SaveMode = "transaction" | "another" | "template";
type DatePickerMode = "date" | "time" | null;
type ExpandedSection =
  | "account"
  | "destination"
  | "category"
  | "budget"
  | "label"
  | "loan"
  | "place"
  | "person";

function recordOptions(
  records: JsonObject[],
  profileId: string,
  document: ReturnType<typeof useLocalData>["document"],
  fallbackIcon: string,
  fallbackColor: string,
): TransactionOption[] {
  return records
    .filter(
      (record) => identity(record) && belongsToProfile(document, record, profileId),
    )
    .map((record) => ({
      id: identity(record),
      name:
        typeof record.name === "string" ? record.name : "Untitled option",
      description:
        typeof record.description === "string" ? record.description : "",
      icon: typeof record.icon === "string" ? record.icon : fallbackIcon,
      iconPath:
        typeof record.iconPath === "string" ? record.iconPath : null,
      color:
        typeof record.color === "string" && /^#[a-f\d]{6}$/i.test(record.color)
          ? record.color
          : fallbackColor,
    }));
}

function formatTransactionDate(value: Date) {
  return value.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTransactionTime(value: Date) {
  return value.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function transactionPlaceholder(type: TransactionType) {
  return type === 0
    ? "Expense name"
    : type === 1
      ? "Income name"
      : "Transfer name";
}

export function TransactionEditorScreen({ editId }: { editId?: string }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ copyId?: string }>();
  const insets = useSafeAreaInsets();
  const theme = useAppThemeColors();
  const { document, updateDocument } = useLocalData();
  const { activeProfile } = useProfiles();
  const [profileId] = useState(activeProfile.id);
  const sourceId = editId ?? params.copyId;
  const [sourceDraft] = useState(() =>
    sourceId ? transactionDraftFromRecord(document, sourceId) : null,
  );
  const accounts = selectAccounts(document);
  const categories = selectCategories(document);
  const budgets = selectBudgets(document);
  const defaultAccount =
    accounts.find((account) => account.isDefault) ?? accounts[0];
  const [draft, setDraft] = useState<TransactionDraft>(() => {
    if (sourceDraft)
      return params.copyId
        ? {
            ...sourceDraft,
            receiptPath: null,
            receiptAttachmentId: null,
          }
        : sourceDraft;
    return {
      ...createTransactionDraft(),
      accountId: defaultAccount?.id ?? "",
    };
  });
  const [expanded, setExpanded] = useState<Record<ExpandedSection, boolean>>({
    account: true,
    destination: true,
    category: true,
    budget: true,
    label: false,
    loan: false,
    place: false,
    person: false,
  });
  const [pendingReceipt, setPendingReceipt] = useState<{
    uri: string;
    mimeType: string;
  } | null>(null);
  const [datePickerMode, setDatePickerMode] =
    useState<DatePickerMode>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [categorySheetParentId, setCategorySheetParentId] = useState<
    string | null
  >(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const saving = useRef(false);
  const transactionId = useRef(editId ?? uuid.v4());
  const blurTargetRef = useRef<View | null>(null);
  const [scrollY] = useState(() => new Animated.Value(0));
  const occurredAt = new Date(draft.occurredAt);
  const safeOccurredAt = Number.isFinite(occurredAt.getTime())
    ? occurredAt
    : new Date();
  const selectedAccount = accounts.find(
    (account) => account.id === draft.accountId,
  );
  const accountOptions: TransactionOption[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    description: `${account.institution} - ${account.currencyCode}`,
    icon: account.icon,
    iconPath: account.iconPath,
    color: account.color,
  }));
  const destinationOptions = accountOptions.filter((option) => {
    const account = accounts.find((item) => item.id === option.id);
    return (
      option.id !== draft.accountId &&
      (!selectedAccount || account?.currencyCode === selectedAccount.currencyCode)
    );
  });
  const categoryOptions: TransactionOption[] = categories
    .filter((category) => category.type === draft.type)
    .map((category) => ({
      id: category.id,
      name: category.parentId
        ? `${categories.find((item) => item.id === category.parentId)?.name ?? "Category"} / ${category.name}`
        : category.name,
      description: category.description,
      icon: category.icon,
      iconPath: category.iconPath,
      color: category.color,
    }));
  const categorySheetParent = categorySheetParentId
    ? categories.find((category) => category.id === categorySheetParentId)
    : undefined;
  const categorySheetParentOption = categorySheetParent
    ? {
        id: categorySheetParent.id,
        name: categorySheetParent.name,
        description: categorySheetParent.description,
        icon: categorySheetParent.icon,
        iconPath: categorySheetParent.iconPath,
        color: categorySheetParent.color,
      }
    : null;
  const categorySheetChildren: TransactionOption[] = categorySheetParent
    ? categories
        .filter((category) => {
          const visited = new Set<string>();
          let parentId = category.parentId;
          let isDescendant = false;
          while (parentId && !visited.has(parentId)) {
            if (parentId === categorySheetParent.id) {
              isDescendant = true;
              break;
            }
            visited.add(parentId);
            parentId =
              categories.find((candidate) => candidate.id === parentId)
                ?.parentId ?? null;
          }
          return (
            isDescendant &&
            !categories.some(
              (candidate) => candidate.parentId === category.id,
            )
          );
        })
        .map((category) => ({
          id: category.id,
          name: category.name,
          description:
            categories.find((candidate) => candidate.id === category.parentId)
              ?.name ?? category.description,
          icon: category.icon,
          iconPath: category.iconPath,
          color: category.color,
        }))
    : [];
  const budgetOptions: TransactionOption[] = budgets
    .filter((budget) => budget.transactionType === draft.type)
    .map((budget) => ({
      id: budget.id,
      name: budget.name,
      description: `${budget.period} - ${budget.currencyCode}`,
      icon: budget.icon,
      iconPath: budget.iconPath,
      color: budget.color,
    }));
  const labelOptions = recordOptions(
    document.labels,
    profileId,
    document,
    "check",
    "#70d2eb",
  );
  const loanOptions = recordOptions(
    document.loans,
    profileId,
    document,
    "credit-card",
    "#f2c66d",
  );
  const placeOptions = recordOptions(
    document.places,
    profileId,
    document,
    "home",
    "#78d6a3",
  );
  const personOptions = recordOptions(
    document.peoples,
    profileId,
    document,
    "account",
    "#b89cf5",
  );
  const topControlsTranslateY = scrollY.interpolate({
    inputRange: [0, 56],
    outputRange: [0, -56],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const receiptUri = pendingReceipt?.uri ?? (() => {
    if (!draft.receiptPath) return null;
    try {
      return getAttachmentFile(draft.receiptPath).uri;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    let wasHidden = false;
    const listener = scrollY.addListener(({ value }) => {
      const hidden = value >= 40;
      if (hidden !== wasHidden) {
        wasHidden = hidden;
        setHeaderHidden(hidden);
      }
    });
    return () => scrollY.removeListener(listener);
  }, [scrollY]);

  function change<K extends keyof TransactionDraft>(
    key: K,
    value: TransactionDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
    setNotice("");
  }

  function toggleSection(section: ExpandedSection) {
    Keyboard.dismiss();
    setExpanded((current) => ({ ...current, [section]: !current[section] }));
  }

  function changeType(type: TransactionType) {
    setDraft((current) => ({
      ...current,
      type,
      categoryId: "",
      budgetId: "",
      destinationAccountId: type === 2 ? current.destinationAccountId : "",
    }));
    setError("");
    setNotice("");
  }

  function goBack() {
    if (saving.current) return;
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  function updateDateTime(
    mode: Exclude<DatePickerMode, null>,
    event: DateTimePickerEvent,
    selected?: Date,
  ) {
    if (Platform.OS === "android") setDatePickerMode(null);
    if (event.type === "dismissed" || !selected) return;
    const next = new Date(safeOccurredAt);
    if (mode === "date")
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
      );
    else next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    change("occurredAt", next.toISOString());
  }

  async function pickReceipt() {
    Keyboard.dismiss();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.9,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 25 * 1024 * 1024)
        throw new Error("Choose an image smaller than 25 MB.");
      setPendingReceipt({
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      setDraft((current) => ({
        ...current,
        receiptPath: null,
        receiptAttachmentId: null,
      }));
      setError("");
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "The receipt image could not be selected.";
      setError(message);
      Alert.alert("Unable to select receipt", message);
    }
  }

  async function persist(mode: SaveMode) {
    if (saving.current) return;
    saving.current = true;
    setIsSaving(true);
    setError("");
    setNotice("");
    setActionMenuOpen(false);
    Keyboard.dismiss();
    let pendingAttachmentPath: string | null = null;
    let attachmentCommitted = false;
    try {
      if (mode === "template") {
        const id = uuid.v4();
        await updateDocument((current) => {
          if (current._local.selectedProfileId !== profileId)
            throw new Error(
              "Your active profile changed. Reopen this form before saving.",
            );
          return saveTransactionTemplate(
            current,
            draft,
            id,
            profileId,
            new Date().toISOString(),
          );
        });
        router.dismissTo("/");
        return;
      }

      const attachment = pendingReceipt
        ? await persistAttachment(pendingReceipt.uri, pendingReceipt.mimeType)
        : null;
      pendingAttachmentPath = attachment?.relativePath ?? null;
      const preparedDraft: TransactionDraft = attachment
        ? {
            ...draft,
            receiptPath: attachment.relativePath,
            receiptAttachmentId: attachment.id,
          }
        : draft;
      const id = transactionId.current;
      const now = new Date().toISOString();
      await updateDocument((current) => {
        if (current._local.selectedProfileId !== profileId)
          throw new Error(
            "Your active profile changed. Reopen this form before saving.",
          );
        const saved = saveTransaction(
          current,
          preparedDraft,
          id,
          profileId,
          now,
          !!editId,
        );
        return attachment
          ? {
              ...saved,
              _local: {
                ...saved._local,
                attachments: [...saved._local.attachments, attachment],
              },
            }
          : saved;
      });
      attachmentCommitted = true;
      if (
        sourceDraft?.receiptPath &&
        sourceDraft.receiptPath !== preparedDraft.receiptPath
      ) {
        try {
          deleteAttachment(sourceDraft.receiptPath);
        } catch {}
      }

      if (mode === "another") {
        transactionId.current = uuid.v4();
        setPendingReceipt(null);
        setDraft((current) => ({
          ...current,
          name: "",
          amount: "",
          description: "",
          occurredAt: new Date().toISOString(),
          receiptPath: null,
          receiptAttachmentId: null,
        }));
        setNotice("Transaction saved. Add the next one.");
        return;
      }
      if (editId && router.canGoBack()) router.back();
      else router.dismissTo("/");
    } catch (reason) {
      if (pendingAttachmentPath && !attachmentCommitted) {
        try {
          deleteAttachment(pendingAttachmentPath);
        } catch {}
      }
      const message =
        reason instanceof Error
          ? reason.message
          : "The transaction could not be saved. Please try again.";
      setError(message);
      Alert.alert("Unable to save transaction", message);
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  const missingSource = !!sourceId && !sourceDraft;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.fill}
      >
        <View style={styles.fill}>
          <BlurTargetView ref={blurTargetRef} style={styles.fill}>
            <Animated.ScrollView
              contentContainerStyle={{
                paddingBottom: 148 + insets.bottom,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )}
            >
              <View style={styles.headerSpace} />
              <View style={styles.selectorSpace} />
              <View
                pointerEvents={isSaving ? "none" : "auto"}
                className="gap-4 px-5"
              >
                {missingSource ? (
                  <View className="rounded-2xl bg-danger/10 p-4">
                    <Text className="font-manrope-semibold text-danger">
                      This transaction is no longer available.
                    </Text>
                  </View>
                ) : null}

                <Input
                  accessibilityLabel="Transaction name"
                  placeholder={transactionPlaceholder(draft.type)}
                  maxLength={100}
                  value={draft.name}
                  onChangeText={(value) => change("name", value)}
                  className="h-16 rounded-2xl bg-surface px-4 font-manrope-semibold"
                />

                <View className="relative">
                  <Input
                    accessibilityLabel="Transaction amount"
                    placeholder="Amount (e.g. 1,000.00)"
                    keyboardType="decimal-pad"
                    maxLength={30}
                    value={draft.amount}
                    onChangeText={(value) => change("amount", value)}
                    className="h-16 rounded-2xl bg-surface px-4 pr-14 font-manrope-semibold"
                  />
                  <View
                    pointerEvents="none"
                    className="absolute right-4 top-0 h-16 items-center justify-center"
                  >
                    <FilledIcon name="currency-usd" size={22} tone="muted" />
                  </View>
                </View>

                <Input
                  accessibilityLabel="Transaction description"
                  placeholder="Description (optional)"
                  maxLength={300}
                  value={draft.description}
                  onChangeText={(value) => change("description", value)}
                  className="h-16 rounded-2xl bg-surface px-4"
                />

                <View className="flex-row gap-3">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Change date, ${formatTransactionDate(safeOccurredAt)}`}
                    onPress={() => {
                      Keyboard.dismiss();
                      setDatePickerMode("date");
                    }}
                    className="h-20 flex-1 justify-center gap-1 rounded-2xl bg-surface px-4"
                    style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}
                  >
                    <View className="flex-row items-center gap-2">
                      <FilledIcon name="clock" size={17} tone="muted" />
                      <Text className="font-manrope-medium text-xs text-muted">
                        Date
                      </Text>
                    </View>
                    <Text className="font-manrope-semibold text-base text-foreground">
                      {formatTransactionDate(safeOccurredAt)}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Change time, ${formatTransactionTime(safeOccurredAt)}`}
                    onPress={() => {
                      Keyboard.dismiss();
                      setDatePickerMode("time");
                    }}
                    className="h-20 flex-1 justify-center gap-1 rounded-2xl bg-surface px-4"
                    style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}
                  >
                    <View className="flex-row items-center gap-2">
                      <FilledIcon name="clock" size={17} tone="muted" />
                      <Text className="font-manrope-medium text-xs text-muted">
                        Time
                      </Text>
                    </View>
                    <Text className="font-manrope-semibold text-base text-foreground">
                      {formatTransactionTime(safeOccurredAt)}
                    </Text>
                  </Pressable>
                </View>

                {datePickerMode ? (
                  <View className="overflow-hidden rounded-2xl bg-surface p-2">
                    <DateTimePicker
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      maximumDate={new Date()}
                      mode={datePickerMode}
                      value={safeOccurredAt}
                      onChange={(event, selected) =>
                        updateDateTime(datePickerMode, event, selected)
                      }
                    />
                    {Platform.OS === "ios" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="self-end"
                        onPress={() => setDatePickerMode(null)}
                      >
                        <Button.Label>Done</Button.Label>
                      </Button>
                    ) : null}
                  </View>
                ) : null}

                <TransactionSelectionSection
                  title={draft.type === 2 ? "Transfer account from" : "Account"}
                  placeholder="Select account"
                  icon="credit-card"
                  options={accountOptions}
                  selectedId={draft.accountId}
                  expanded={expanded.account}
                  compact
                  disabled={isSaving}
                  onToggle={() => toggleSection("account")}
                  onSelect={(accountId) => {
                    setDraft((current) => ({
                      ...current,
                      accountId,
                      destinationAccountId:
                        current.destinationAccountId === accountId
                          ? ""
                          : current.destinationAccountId,
                    }));
                    setError("");
                  }}
                  onAdd={() => router.push("/accounts/create")}
                />

                {draft.type === 2 ? (
                  <TransactionSelectionSection
                    title="Transfer account to"
                    placeholder="Select destination account"
                    icon="credit-card"
                    options={destinationOptions}
                    selectedId={draft.destinationAccountId}
                    expanded={expanded.destination}
                    compact
                    disabled={isSaving}
                    onToggle={() => toggleSection("destination")}
                    onSelect={(value) => change("destinationAccountId", value)}
                    onAdd={() => router.push("/accounts/create")}
                  />
                ) : null}

                <TransactionSelectionSection
                  title="Category"
                  placeholder="Select category"
                  icon="chart-donut-variant"
                  options={categoryOptions}
                  selectedId={draft.categoryId}
                  expanded={expanded.category}
                  compact
                  disabled={isSaving}
                  optional
                  onToggle={() => toggleSection("category")}
                  onSelect={(value) => {
                    const hasChildren = categories.some(
                      (category) => category.parentId === value,
                    );
                    if (value && hasChildren) setCategorySheetParentId(value);
                    else change("categoryId", value);
                  }}
                  onAdd={() =>
                    router.push({
                      pathname: "/categories/create",
                      params: { type: String(draft.type) },
                    })
                  }
                />

                <TransactionSelectionSection
                  title="Budget"
                  placeholder="Select a budget"
                  icon="wallet"
                  options={budgetOptions}
                  selectedId={draft.budgetId}
                  expanded={expanded.budget}
                  compact
                  disabled={isSaving}
                  optional
                  onToggle={() => toggleSection("budget")}
                  onSelect={(value) => change("budgetId", value)}
                  onAdd={() => router.push("/budgets/create")}
                />

                <TransactionSelectionSection
                  title="Label"
                  placeholder="Select label"
                  icon="check"
                  options={labelOptions}
                  selectedId={draft.labelId}
                  expanded={expanded.label}
                  disabled={isSaving}
                  optional
                  onToggle={() => toggleSection("label")}
                  onSelect={(value) => change("labelId", value)}
                />

                <TransactionSelectionSection
                  title="Loan"
                  placeholder="Select loan"
                  icon="credit-card"
                  options={loanOptions}
                  selectedId={draft.loanId}
                  expanded={expanded.loan}
                  disabled={isSaving}
                  optional
                  onToggle={() => toggleSection("loan")}
                  onSelect={(value) => change("loanId", value)}
                />

                <TransactionSelectionSection
                  title="Place"
                  placeholder="Select a place"
                  icon="home"
                  options={placeOptions}
                  selectedId={draft.placeId}
                  expanded={expanded.place}
                  disabled={isSaving}
                  optional
                  onToggle={() => toggleSection("place")}
                  onSelect={(value) => change("placeId", value)}
                />

                <TransactionSelectionSection
                  title="Payee"
                  placeholder="Select a person"
                  icon="account"
                  options={personOptions}
                  selectedId={draft.personId}
                  expanded={expanded.person}
                  disabled={isSaving}
                  optional
                  onToggle={() => toggleSection("person")}
                  onSelect={(value) => change("personId", value)}
                />

                <View className="gap-3 pb-3">
                  <Text className="font-manrope-semibold text-base text-foreground">
                    Receipt or bill (optional)
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      receiptUri ? "Replace receipt image" : "Add receipt image"
                    }
                    onPress={pickReceipt}
                    className="min-h-52 overflow-hidden rounded-2xl border border-border bg-surface"
                    style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
                  >
                    {receiptUri ? (
                      <Image
                        resizeMode="cover"
                        source={{ uri: receiptUri }}
                        style={StyleSheet.absoluteFill}
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center gap-2 px-6 py-10">
                        <FilledIcon name="camera" size={42} tone="accent" />
                        <Text className="text-center font-manrope-semibold text-base text-accent">
                          Add receipt or bill
                        </Text>
                        <Text className="text-center font-sans text-sm text-muted">
                          Tap to select an image
                        </Text>
                      </View>
                    )}
                  </Pressable>
                  {receiptUri ? (
                    <Button
                      variant="danger-soft"
                      className="self-start"
                      onPress={() => {
                        setPendingReceipt(null);
                        setDraft((current) => ({
                          ...current,
                          receiptPath: null,
                          receiptAttachmentId: null,
                        }));
                      }}
                    >
                      <FilledIcon name="close" size={18} tone="danger" />
                      <Button.Label>Remove receipt</Button.Label>
                    </Button>
                  ) : null}
                </View>
              </View>
            </Animated.ScrollView>
          </BlurTargetView>

          <LinearGradient
            colors={[
              theme.background,
              colorWithAlpha(theme.background, 0.82),
              colorWithAlpha(theme.background, 0),
            ]}
            locations={[0, 0.58, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
            style={styles.topScrim}
          />

          <View
            pointerEvents={headerHidden ? "none" : "box-none"}
            accessibilityElementsHidden={headerHidden}
            importantForAccessibility={
              headerHidden ? "no-hide-descendants" : "auto"
            }
            style={styles.headerClip}
          >
            <Animated.View
              style={[
                styles.headerDock,
                {
                  opacity: headerOpacity,
                  transform: [{ translateY: topControlsTranslateY }],
                },
              ]}
            >
              <Button
                isIconOnly
                variant="ghost"
                accessibilityLabel="Go back"
                isDisabled={isSaving}
                onPress={goBack}
              >
                <FilledIcon name="arrow-left" size={24} />
              </Button>
              <Text
                accessibilityRole="header"
                numberOfLines={1}
                className="flex-1 font-manrope-bold text-xl text-foreground"
              >
                {editId ? "Edit transaction" : "Transaction"}
              </Text>
            </Animated.View>
          </View>

          <Animated.View
            pointerEvents={isSaving ? "none" : "auto"}
            style={[
              styles.selectorDock,
              { transform: [{ translateY: topControlsTranslateY }] },
            ]}
          >
            <GlassSegmentedControl
              accessibilityLabel="Transaction type"
              blurTarget={blurTargetRef}
              minHeight={Platform.OS === "android" ? 52 : 48}
              options={TYPE_OPTIONS}
              value={draft.type}
              onChange={changeType}
            />
          </Animated.View>

          <LinearGradient
            colors={[
              colorWithAlpha(theme.background, 0),
              colorWithAlpha(theme.background, 0.72),
              theme.background,
              theme.background,
            ]}
            locations={[
              0,
              (128 * 0.54) / (128 + insets.bottom),
              128 / (128 + insets.bottom),
              1,
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
            style={[styles.bottomScrim, { height: 128 + insets.bottom }]}
          />

          <View
            pointerEvents="box-none"
            style={[styles.actionDock, { bottom: Math.max(insets.bottom, 10) }]}
          >
            {!!error && (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                className="font-sans text-sm text-danger"
              >
                {error}
              </Text>
            )}
            {!!notice && !error && (
              <Text
                accessibilityLiveRegion="polite"
                className="font-sans text-sm text-accent"
              >
                {notice}
              </Text>
            )}
            <View style={styles.splitActionRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isSaving
                    ? "Saving transaction"
                    : editId
                      ? "Save transaction changes"
                      : "Add transaction"
                }
                accessibilityState={{
                  busy: isSaving,
                  disabled: isSaving || missingSource,
                }}
                disabled={isSaving || missingSource}
                onPress={() => persist("transaction")}
                android_ripple={{
                  color: colorWithAlpha(theme.accentForeground, 0.16),
                  borderless: false,
                }}
                style={({ pressed }) => [
                  styles.primaryActionButton,
                  { backgroundColor: theme.accent },
                  (isSaving || missingSource) && styles.actionDisabled,
                  Platform.OS === "ios" &&
                    pressed &&
                    styles.actionPressed,
                ]}
              >
                <FilledIcon name="save" size={24} tone="accent-foreground" />
                <Text
                  numberOfLines={1}
                  className="shrink font-manrope-bold text-base text-accent-foreground"
                >
                  {isSaving
                    ? "Saving..."
                    : editId
                      ? "Save changes"
                      : "Add transaction"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="More save options"
                accessibilityState={{ disabled: isSaving || missingSource }}
                disabled={isSaving || missingSource}
                onPress={() => {
                  Keyboard.dismiss();
                  setActionMenuOpen(true);
                }}
                android_ripple={{
                  color: colorWithAlpha(theme.accentForeground, 0.16),
                  borderless: false,
                }}
                style={({ pressed }) => [
                  styles.secondaryActionButton,
                  { backgroundColor: theme.accent },
                  (isSaving || missingSource) && styles.actionDisabled,
                  Platform.OS === "ios" &&
                    pressed &&
                    styles.actionPressed,
                ]}
              >
                <FilledIcon
                  name="chevron-up"
                  size={27}
                  tone="accent-foreground"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <BottomSheet
        isOpen={actionMenuOpen}
        onOpenChange={setActionMenuOpen}
      >
        <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            topInset={insets.top}
            bottomInset={insets.bottom}
            contentContainerClassName="px-5 pb-0 pt-2"
            backgroundClassName="rounded-t-[28px] bg-surface"
          >
            <View
              className="gap-2"
              style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
            >
              <BottomSheet.Title className="px-2 pb-2">
                Save options
              </BottomSheet.Title>
              <Button
                variant="ghost"
                className="h-16 justify-start"
                onPress={() => persist("another")}
              >
                <FilledIcon name="plus" size={24} tone="accent" />
                <Button.Label>Save and add another</Button.Label>
              </Button>
              <Button
                variant="ghost"
                className="h-16 justify-start"
                onPress={() => persist("template")}
              >
                <FilledIcon name="backup" size={24} tone="accent" />
                <Button.Label>Save as template</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
      {categorySheetParentOption ? (
        <TransactionCategorySheet
          parent={categorySheetParentOption}
          options={categorySheetChildren}
          selectedId={draft.categoryId}
          onSelect={(value) => change("categoryId", value)}
          onDismiss={() => setCategorySheetParentId(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerSpace: { height: 56 },
  selectorSpace: { height: 84 },
  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 10,
  },
  headerClip: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 56,
    overflow: "hidden",
    zIndex: 20,
  },
  headerDock: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectorDock: {
    position: "absolute",
    top: 64,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  bottomScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  actionDock: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    gap: 6,
    zIndex: 20,
  },
  splitActionRow: {
    flexDirection: "row",
    gap: 4,
  },
  primaryActionButton: {
    height: 58,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 29,
    borderBottomLeftRadius: 29,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
  },
  secondaryActionButton: {
    width: 68,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 29,
    borderBottomRightRadius: 29,
    overflow: "hidden",
  },
  actionPressed: { opacity: 0.78 },
  actionDisabled: { opacity: 0.5 },
});