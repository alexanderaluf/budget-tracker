import { uuid } from "expo-modules-core";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Button, Input, Switch as HeroSwitch } from "heroui-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useLocalData } from "@/data/local-data-provider";
import {
  ACCOUNT_TYPES,
  CARD_COMPANIES,
  addAccountToDocument,
  updateAccountInDocument,
  validateAccountDraft,
  type AccountDraft,
} from "@/data/model/account-record";
import { CurrencySelectorSheet } from "@/features/profile/components/currency-selector-sheet";
import { currencies } from "@/features/profile/data/currencies-data";
import { useProfiles } from "@/features/profile/profile-provider";
import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";
import { ACCOUNT_COLORS, colorForeground } from "./account-options";
import { AccountIcon } from "./components/account-icon";
import { AccountIconPicker, AccountPicker } from "./components/account-picker";
import { CardCompanyLogo } from "./components/card-company-logo";
import { selectAccountDraft } from "@/data/selectors/document-selectors";

const defaultIcons = {
  card: "credit-card",
  cash: "cash",
  savings: "piggy-bank",
} as const;

type AccountType = (typeof ACCOUNT_TYPES)[number];
type TypeFrame = { width: number; x: number };

function AccountTypeSelector({
  selected,
  onChange,
}: {
  selected: AccountType;
  onChange: (type: AccountType) => void;
}) {
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const typeFrames = useRef<Partial<Record<AccountType, TypeFrame>>>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const selectedFrame = typeFrames.current[selected];
    if (!selectedFrame) return;

    indicatorX.value = withSpring(selectedFrame.x, {
      damping: 20,
      mass: 0.7,
      stiffness: 210,
    });
    indicatorWidth.value = withSpring(selectedFrame.width, {
      damping: 22,
      mass: 0.7,
      stiffness: 230,
    });
  }, [indicatorWidth, indicatorX, selected]);

  function handleTypeLayout(type: AccountType, event: LayoutChangeEvent) {
    const { width, x } = event.nativeEvent.layout;
    typeFrames.current[type] = { width, x };

    if (type === selected) {
      indicatorX.value = x;
      indicatorWidth.value = width;
      setIsReady(true);
    }
  }

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      className="border border-border"
      style={[
        styles.typeSelector,
        Platform.OS === "android" && styles.androidTypeSelector,
      ]}
    >
      <View style={styles.typeTrack}>
        {isReady ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.typeIndicator, indicatorStyle]}
          />
        ) : null}
        {ACCOUNT_TYPES.map((type) => {
          const isSelected = type === selected;
          return (
            <Pressable
              key={type}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              className="min-h-12 flex-1 items-center justify-center rounded-full"
              onLayout={(event) => handleTypeLayout(type, event)}
              onPress={() => onChange(type)}
              style={({ pressed }) => [
                styles.typeTab,
                Platform.OS === "android" && styles.androidTypeTab,
                pressed && styles.pressed,
              ]}
            >
              <Text
                className={`font-manrope-bold capitalize ${isSelected ? "text-accent-foreground" : "text-foreground"}`}
              >
                {type}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function OptionRow({
  icon,
  title,
  description,
  onPress,
  hasDivider = false,
  leading,
}: {
  icon: FilledIconName;
  title: string;
  description: string;
  onPress: () => void;
  hasDivider?: boolean;
  leading?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${description}`}
      onPress={onPress}
      className={`min-h-20 flex-row items-center gap-4 py-3 ${
        hasDivider ? "border-b border-border" : ""
      }`}
    >
      {leading ?? <FilledIcon name={icon} color="#70d2eb" size={26} />}
      <View className="flex-1 gap-1">
        <Text className="font-manrope-semibold text-base text-foreground">
          {title}
        </Text>
        <Text className="font-sans text-sm text-muted">{description}</Text>
      </View>
      <FilledIcon name="chevron-right" color="#ededed" size={24} />
    </Pressable>
  );
}

export function AccountCreateScreen({ editId }: { editId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { document, updateDocument } = useLocalData();
  const { activeProfile } = useProfiles();
  // Capture the owner for this draft; a later profile change cannot reassign it.
  const [profileId] = useState(activeProfile.id);
  const [draft, setDraft] = useState<AccountDraft>(() => (editId ? selectAccountDraft(document, editId) : null) ?? {
    name: "",
    amount: "",
    accountNumber: "",
    accountType: "card",
    currencyCode: activeProfile.currencyCode.toUpperCase(),
    icon: "credit-card",
    iconPath: null,
    color: ACCOUNT_COLORS[0],
    isDefault: false,
    isExcluded: false,
    cardLastFour: "",
    cardCompany: "",
    paymentDay: null,
  });
  const [picker, setPicker] = useState<
    "icon" | "currency" | "company" | "day" | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const accountId = useRef<string | null>(null);
  const iconChosen = useRef(!!editId);
  const color = /^#[a-f\d]{6}$/i.test(draft.color)
    ? draft.color
    : ACCOUNT_COLORS[0];
  const currency = currencies.find((item) => item.code === draft.currencyCode);
  function change<K extends keyof AccountDraft>(
    key: K,
    value: AccountDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }
  function openPicker(next: typeof picker) {
    Keyboard.dismiss();
    setPicker(next);
  }
  function goBack() {
    if (!saving.current) {
      if (router.canGoBack()) router.back();
      else router.replace("/accounts");
    }
  }

  async function save() {
    if (saving.current) return;
    try {
      validateAccountDraft(draft);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Check the account details.",
      );
      return;
    }
    saving.current = true;
    setIsSaving(true);
    Keyboard.dismiss();
    try {
      accountId.current ??= uuid.v4();
      const id = accountId.current;
      const now = new Date().toISOString();
      await updateDocument((current) =>
        editId ? updateAccountInDocument(current, draft, editId, now) : addAccountToDocument(current, draft, profileId, id, now),
      );
      if (editId) router.back();
      else router.dismissTo("/accounts");
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "Your account could not be saved. Please try again.";
      setError(message);
      Alert.alert("Unable to save account", message);
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-row items-center gap-3 px-4 py-2">
          <Button
            isIconOnly
            isDisabled={isSaving}
            variant="ghost"
            accessibilityLabel="Go back"
            onPress={goBack}
          >
            <FilledIcon name="arrow-left" color="#ededed" size={24} />
          </Button>
          <Text
            accessibilityRole="header"
            className="font-manrope-bold text-xl text-foreground"
          >
            {editId ? "Edit account" : "New account"}
          </Text>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-5 px-5 pt-3"
          contentContainerStyle={{ paddingBottom: 104 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          <View pointerEvents={isSaving ? "none" : "auto"} className="gap-5">
            <AccountTypeSelector
              selected={draft.accountType}
              onChange={(type) => {
                change("accountType", type);
                if (!iconChosen.current) {
                  setDraft((current) => ({
                    ...current,
                    accountType: type,
                    icon: defaultIcons[type],
                    iconPath: null,
                  }));
                }
              }}
            />
            <View className="gap-2">
              <Text className="font-manrope-medium text-sm text-muted">
                Account name
              </Text>
              <View className="flex-row items-center gap-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose account icon"
                  onPress={() => openPicker("icon")}
                  className="size-16 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: color }}
                >
                  <AccountIcon
                    name={draft.icon}
                    pathData={draft.iconPath}
                    color={colorForeground(color)}
                    size={30}
                  />
                  <View className="absolute -bottom-1 -right-1 rounded-full border-2 border-black bg-surface p-1">
                    <FilledIcon name="pencil" color="#ededed" size={13} />
                  </View>
                </Pressable>
                <Input
                  accessibilityLabel="Account name"
                  placeholder="e.g. Everyday card"
                  maxLength={100}
                  value={draft.name}
                  onChangeText={(value) => change("name", value)}
                  containerClassName="flex-1"
                  className="h-16 rounded-2xl bg-surface font-manrope-semibold"
                />
              </View>
            </View>
            <View className="gap-2">
              <Text className="font-manrope-medium text-sm text-muted">
                Opening balance ({draft.currencyCode})
              </Text>
              <View className="flex-row items-center gap-2">
                <Button
                  variant="secondary"
                  accessibilityLabel="Toggle negative balance"
                  onPress={() =>
                    change(
                      "amount",
                      draft.amount.startsWith("-")
                        ? draft.amount.slice(1)
                        : `-${draft.amount}`,
                    )
                  }
                >
                  <Button.Label>+/−</Button.Label>
                </Button>
                <Input
                  accessibilityLabel="Opening balance"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={draft.amount}
                  onChangeText={(value) => change("amount", value)}
                  containerClassName="flex-1"
                  className="h-14 rounded-2xl bg-surface"
                />
              </View>
            </View>
            <View className="gap-2">
              <Text className="font-manrope-medium text-sm text-muted">
                Account number (optional)
              </Text>
              <Input
                accessibilityLabel="Account number"
                placeholder="Account number"
                autoCorrect={false}
                maxLength={64}
                value={draft.accountNumber}
                onChangeText={(value) => change("accountNumber", value)}
                className="h-14 rounded-2xl bg-surface"
              />
            </View>
            {draft.accountType === "card" && (
              <View className="gap-3 pt-1">
                <View className="flex-row items-center gap-3">
                  <FilledIcon name="credit-card" color="#70d2eb" size={24} />
                  <Text className="font-manrope-semibold text-base text-foreground">
                    Card details
                  </Text>
                </View>
                <View className="gap-2">
                  <Text className="font-manrope-medium text-sm text-muted">
                    Last four digits
                  </Text>
                  <Input
                    accessibilityLabel="Card last four digits"
                    placeholder="1234"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={draft.cardLastFour}
                    onChangeText={(value) => change("cardLastFour", value)}
                    className="h-14 rounded-2xl bg-surface"
                  />
                </View>
                <View>
                  <OptionRow
                    icon="credit-card"
                    title="Card company"
                    description={draft.cardCompany || "Select company"}
                    leading={
                      draft.cardCompany ? (
                        <CardCompanyLogo company={draft.cardCompany} />
                      ) : undefined
                    }
                    onPress={() => openPicker("company")}
                    hasDivider
                  />
                  <OptionRow
                    icon="clock"
                    title="Monthly payment day"
                    description={
                      draft.paymentDay
                        ? `Day ${String(draft.paymentDay).padStart(2, "0")} of every month`
                        : "Choose a day"
                    }
                    onPress={() => openPicker("day")}
                  />
                </View>
                <Text className="font-sans text-xs leading-5 text-muted">
                  For shorter months, days 29–31 use the last day of the month.
                </Text>
              </View>
            )}
            <OptionRow
              icon="currency-exchange"
              title="Account currency"
              description={`${draft.currencyCode} (${currency?.symbol ?? draft.currencyCode})`}
              onPress={() => openPicker("currency")}
            />
            {(
              [
                {
                  key: "isDefault",
                  icon: "check",
                  title: "Set as default account",
                  description: "Use this account by default for this profile.",
                },
                {
                  key: "isExcluded",
                  icon: "eye-off",
                  title: "Exclude account",
                  description:
                    "Keep this account and its transactions out of balances and spending summaries.",
                },
              ] as const
            ).map((option) => (
              <Pressable
                key={option.key}
                accessibilityRole="switch"
                accessibilityLabel={option.title}
                accessibilityHint={option.description}
                accessibilityState={{
                  checked: draft[option.key],
                  disabled: isSaving,
                }}
                disabled={isSaving}
                onPress={() => change(option.key, !draft[option.key])}
                className="flex-row items-center gap-4 py-2"
              >
                <FilledIcon
                  name={option.icon}
                  color={option.key === "isExcluded" ? "#ef8175" : "#70d2eb"}
                  size={26}
                />
                <View className="flex-1 gap-1">
                  <Text className="font-manrope-semibold text-base text-foreground">
                    {option.title}
                  </Text>
                  <Text className="font-sans text-sm leading-5 text-muted">
                    {option.description}
                  </Text>
                </View>
                <View
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  className="shrink-0"
                >
                  {Platform.OS === "android" ? (
                    <HeroSwitch
                      isSelected={draft[option.key]}
                      isDisabled={isSaving}
                      style={{ width: 60, height: 28 }}
                    >
                      <HeroSwitch.Thumb style={{ width: 36, height: 24 }} />
                    </HeroSwitch>
                  ) : (
                    <Switch
                      value={draft[option.key]}
                      disabled={isSaving}
                      trackColor={{ false: "#333333", true: "#70d2eb" }}
                      thumbColor={draft[option.key] ? "#073442" : "#bdbdbd"}
                    />
                  )}
                </View>
              </Pressable>
            ))}
            <View className="gap-3">
              <Text className="font-manrope-semibold text-base text-foreground">
                Account color
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {ACCOUNT_COLORS.map((swatch) => (
                  <Pressable
                    key={swatch}
                    accessibilityRole="radio"
                    accessibilityLabel={`Color ${swatch}`}
                    accessibilityState={{
                      checked: draft.color.toLowerCase() === swatch,
                    }}
                    onPress={() => change("color", swatch)}
                    className="size-11 items-center justify-center rounded-xl border border-white/10"
                    style={{ backgroundColor: swatch }}
                  >
                    {draft.color.toLowerCase() === swatch && (
                      <FilledIcon
                        name="check"
                        color={colorForeground(swatch)}
                        size={24}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
              <Input
                accessibilityLabel="Custom hex color"
                placeholder="#70d2eb"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={7}
                value={draft.color}
                onChangeText={(value) => change("color", value)}
                className="rounded-xl bg-surface"
              />
              <Text className="font-sans text-xs text-muted">
                Choose a swatch or enter a custom hex color.
              </Text>
            </View>
          </View>
        </ScrollView>
        <LinearGradient
          colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.72)", "#000000"]}
          end={{ x: 0.5, y: 1 }}
          locations={[0, 0.58, 1]}
          pointerEvents="none"
          start={{ x: 0.5, y: 0 }}
          style={[styles.bottomScrim, { height: 104 + insets.bottom }]}
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
          <Pressable
            accessibilityLabel={isSaving ? "Saving account" : editId ? "Save changes" : "Add account"}
            accessibilityRole="button"
            accessibilityState={{ busy: isSaving, disabled: isSaving }}
            disabled={isSaving}
            onPress={save}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
              isSaving && styles.disabled,
            ]}
          >
            <FilledIcon name="credit-card-plus" color="#073442" size={24} />
            <Text className="font-manrope-bold text-base text-[#073442]">
              {isSaving ? "Saving…" : editId ? "Save changes" : "Add account"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      {picker === "currency" && (
        <CurrencySelectorSheet
          currencies={currencies}
          isOpen
          selectedCode={draft.currencyCode}
          onOpenChange={(open) => {
            if (!open) setPicker(null);
          }}
          onSelect={(item) => change("currencyCode", item.code)}
        />
      )}
      {picker === "icon" && (
        <AccountIconPicker
          selected={{ name: draft.icon, pathData: draft.iconPath }}
          onClose={() => setPicker(null)}
          onSelect={(icon) => {
            iconChosen.current = true;
            setDraft((current) => ({
              ...current,
              icon: icon.name,
              iconPath: icon.pathData,
            }));
            setError("");
          }}
        />
      )}
      {picker === "company" && (
        <AccountPicker title="Card company" onClose={() => setPicker(null)}>
          <ScrollView contentContainerClassName="px-5 pb-5">
            {CARD_COMPANIES.map((company) => (
              <Pressable
                key={company}
                accessibilityRole="radio"
                accessibilityLabel={company}
                accessibilityState={{ checked: draft.cardCompany === company }}
                onPress={() => {
                  change("cardCompany", company);
                  setPicker(null);
                }}
                className="min-h-16 flex-row items-center gap-4 border-b border-border py-4"
              >
                <CardCompanyLogo company={company} />
                <Text className="flex-1 font-manrope-semibold text-base text-foreground">
                  {company}
                </Text>
                {draft.cardCompany === company && (
                  <FilledIcon name="check" color="#70d2eb" size={24} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </AccountPicker>
      )}
      {picker === "day" && (
        <AccountPicker
          title="Monthly payment day"
          onClose={() => setPicker(null)}
        >
          <ScrollView contentContainerClassName="gap-5 px-5 py-5">
            <Text className="font-sans text-base text-muted">
              Choose the day your card is paid each month.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {Array.from({ length: 31 }, (_, index) => index + 1).map(
                (day) => (
                  <Pressable
                    key={day}
                    accessibilityRole="radio"
                    accessibilityLabel={`Day ${day} of every month`}
                    accessibilityState={{ checked: draft.paymentDay === day }}
                    onPress={() => {
                      change("paymentDay", day);
                      setPicker(null);
                    }}
                    className={`size-12 items-center justify-center rounded-full ${draft.paymentDay === day ? "bg-accent" : "bg-surface"}`}
                  >
                    <Text
                      className={`font-manrope-bold text-base ${draft.paymentDay === day ? "text-accent-foreground" : "text-foreground"}`}
                    >
                      {String(day).padStart(2, "0")}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
            <Text className="font-sans text-sm text-muted">
              Days 29–31 fall on the last day in shorter months.
            </Text>
          </ScrollView>
        </AccountPicker>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  typeSelector: {
    borderRadius: 999,
    overflow: "hidden",
  },
  typeTrack: {
    flexDirection: "row",
    margin: 4,
    position: "relative",
  },
  typeTab: {
    zIndex: 1,
  },
  androidTypeSelector: {
    minHeight: 60,
  },
  androidTypeTab: {
    height: 52,
    minHeight: 52,
  },
  typeIndicator: {
    backgroundColor: "#70d2eb",
    borderRadius: 999,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    top: 0,
  },
  bottomScrim: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
  actionDock: {
    gap: 6,
    left: 0,
    paddingHorizontal: 12,
    position: "absolute",
    right: 0,
    zIndex: 20,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#70d2eb",
    borderRadius: 29,
    flexDirection: "row",
    gap: 10,
    height: 58,
    justifyContent: "center",
    overflow: "hidden",
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
});
