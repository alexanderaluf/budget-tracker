import { KeyboardArrowUpFill } from "@material-symbols-svg/react-native/rounded/icons/keyboard-arrow-up";
import Animated from "react-native-reanimated";
import {
  CategoryFormSections,
  categoryEntrance,
} from "./components/category-motion";
import { CategoryParentOptions } from "./components/category-parent-options";
import { uuid } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Input, Switch as HeroSwitch } from "heroui-native";
import { useMemo, useRef, useState } from "react";
import {
  Keyboard,
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
  categoryFamily,
  saveCategory,
  type CategoryDraft,
  type CategoryType,
} from "@/data/model/category-record";
import { selectCategories } from "@/data/selectors/document-selectors";
import { useProfiles } from "@/features/profile/profile-provider";
import { ICON_COLORS, colorForeground } from "@/shared/icons/colors";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { IconPicker } from "@/shared/ui/icon-picker";
import { RecordIcon } from "@/shared/ui/record-icon";
import { useAppThemeColors } from "@/shared/theme/app-theme";
import {
  CategoryChip,
  CategoryHeader,
  CategoryTypeSelector,
} from "./components/category-ui";

export function CategoryEditorScreen({ editId }: { editId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppThemeColors();
  const params = useLocalSearchParams<{ parentId?: string; type?: string }>();
  const { document, updateDocument } = useLocalData();
  const { activeProfile } = useProfiles();
  const [profileId] = useState(activeProfile.id);
  const [initialSelection] = useState(document._local.selectedProfileId);
  const categories = useMemo(() => selectCategories(document), [document]);
  const existing = categories.find((category) => category.id === editId);
  const [draft, setDraft] = useState<CategoryDraft>(
    () =>
      existing ?? {
        name: "",
        description: "",
        type: (params.type === "1"
          ? 1
          : params.type === "2"
            ? 2
            : 0) as CategoryType,
        parentId: params.parentId ?? null,
        icon: "shopping",
        iconPath: null,
        color: "#ef5350",
        isDefault: false,
      },
  );
  const [showIcons, setShowIcons] = useState(false);
  const [showParents, setShowParents] = useState(!!params.parentId);
  const [palette, setPalette] = useState<"Primary" | "Accent" | "Custom">(
    "Primary",
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const id = useRef(editId ?? uuid.v4());
  const family = useMemo(
    () =>
      editId ? categoryFamily(document.categories, editId) : new Set<string>(),
    [document.categories, editId],
  );
  const parents = categories.filter(
    (category) => category.type === draft.type && !family.has(category.id),
  );
  const parent = categories.find((category) => category.id === draft.parentId);
  const color = /^#[a-f\d]{6}$/i.test(draft.color) ? draft.color : "#70d2eb";
  function change<K extends keyof CategoryDraft>(
    key: K,
    value: CategoryDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setIsSaving(true);
    Keyboard.dismiss();
    try {
      await updateDocument((current) => {
        if (current._local.selectedProfileId !== initialSelection)
          throw new Error(
            "Your active profile changed. Reopen this form before saving.",
          );
        return saveCategory(
          current,
          draft,
          id.current,
          profileId,
          new Date().toISOString(),
          !!editId,
        );
      });
      if (router.canGoBack()) router.back();
      else router.replace("/categories");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to save category. Please try again.",
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }
  const swatches =
    palette === "Accent"
      ? ICON_COLORS.map((hex) => {
          const rgb = [1, 3, 5].map((start) =>
            Math.round(
              parseInt(hex.slice(start, start + 2), 16) * 0.65 + 255 * 0.35,
            )
              .toString(16)
              .padStart(2, "0"),
          );
          return `#${rgb.join("")}`;
        })
      : ICON_COLORS;
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <CategoryHeader
        title={editId ? "Edit category" : "Category"}
        disabled={isSaving}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            gap: 22,
            paddingBottom: 108 + insets.bottom,
          }}
        >
          {editId && !existing ? (
            <Text className="text-danger">This category no longer exists.</Text>
          ) : (
            <CategoryFormSections
              pointerEvents={isSaving ? "none" : "auto"}
              className="gap-5"
            >
              <CategoryTypeSelector
                value={draft.type}
                onChange={(type) => {
                  setDraft((current) => ({ ...current, type, parentId: null }));
                  setError("");
                }}
              />
              <View className="flex-row items-center gap-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose category icon"
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowIcons(true);
                  }}
                  className="size-16 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: color }}
                >
                  <RecordIcon
                    name={draft.icon}
                    pathData={draft.iconPath}
                    color={colorForeground(color)}
                    size={32}
                  />
                  <View className="absolute -bottom-1 -right-1 rounded-full border-2 border-background bg-surface p-1">
                    <FilledIcon name="pencil" size={14} />
                  </View>
                </Pressable>
                <Input
                  accessibilityLabel="Category name"
                  placeholder="Enter category name"
                  maxLength={100}
                  value={draft.name}
                  onChangeText={(value) => change("name", value)}
                  containerClassName="flex-1"
                  className="h-16 rounded-2xl bg-surface"
                />
              </View>
              <Input
                accessibilityLabel="Description"
                placeholder="Enter description"
                multiline
                maxLength={500}
                value={draft.description}
                onChangeText={(value) => change("description", value)}
                className="h-14 min-h-14 rounded-2xl bg-surface"
              />
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{
                  checked: draft.isDefault,
                  disabled: isSaving,
                }}
                accessibilityLabel="Default category"
                disabled={isSaving}
                onPress={() => change("isDefault", !draft.isDefault)}
                className="flex-row items-center gap-4 rounded-2xl py-2"
                style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
              >
                <View className="flex-1 gap-1">
                  <Text className="font-manrope-bold text-lg text-foreground">
                    Default category
                  </Text>
                  <Text className="font-sans text-sm leading-5 text-muted">
                    Use as the preferred category for this transaction type.
                  </Text>
                </View>
                <View
                  pointerEvents="none"
                  importantForAccessibility="no-hide-descendants"
                >
                  <HeroSwitch
                    isSelected={draft.isDefault}
                    isDisabled={isSaving}
                    style={{ width: 60, height: 28 }}
                  >
                    <HeroSwitch.Thumb style={{ width: 36, height: 24 }} />
                  </HeroSwitch>
                </View>
              </Pressable>
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showParents }}
                  onPress={() => setShowParents((value) => !value)}
                  className="min-h-16 flex-row items-center gap-3"
                >
                  <FilledIcon name="filter" size={27} />
                  <View className="flex-1 gap-1">
                    <Text className="font-manrope-semibold text-lg text-foreground">
                      Parent category
                    </Text>
                    <Text className="font-sans text-base text-muted">
                      {parent?.name ?? "None · Main category"}
                    </Text>
                  </View>
                  <View
                    style={{
                      transform: [{ rotate: showParents ? "180deg" : "0deg" }],
                    }}
                  >
                    <KeyboardArrowUpFill color={theme.accent} size={26} />
                  </View>
                </Pressable>
                <CategoryParentOptions open={showParents}>
                  <View className="flex-row flex-wrap gap-2">
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => change("parentId", null)}
                      className="min-h-11 justify-center rounded-full border px-4"
                      style={{
                        borderColor: !draft.parentId
                          ? theme.accent
                          : theme.border,
                      }}
                    >
                      <Text className="font-manrope-medium text-foreground">
                        None
                      </Text>
                    </Pressable>
                    {parents.map((category) => (
                      <CategoryChip
                        key={category.id}
                        category={category}
                        selected={draft.parentId === category.id}
                        onPress={() => change("parentId", category.id)}
                      />
                    ))}
                  </View>
                </CategoryParentOptions>
              </View>
              <Text className="mt-2 font-manrope-semibold text-lg text-foreground">
                Colors
              </Text>
              <View className="flex-row rounded-xl bg-surface p-1">
                {(["Primary", "Accent", "Custom"] as const).map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: palette === value }}
                    onPress={() => setPalette(value)}
                    className={`min-h-11 flex-1 items-center justify-center rounded-lg ${
                      palette === value ? "bg-accent" : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={
                        palette === value
                          ? "text-accent-foreground"
                          : "text-foreground"
                      }
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {palette === "Custom" ? (
                <Input
                  accessibilityLabel="Custom hex color"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="#70D2EB"
                  maxLength={7}
                  value={draft.color}
                  onChangeText={(value) => change("color", value)}
                />
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {swatches.map((hex) => (
                    <Pressable
                      key={hex}
                      accessibilityRole="radio"
                      accessibilityLabel={`Color ${hex}`}
                      accessibilityState={{
                        checked:
                          draft.color.toLowerCase() === hex.toLowerCase(),
                      }}
                      onPress={() => change("color", hex)}
                      style={{
                        backgroundColor: hex,
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {draft.color.toLowerCase() === hex.toLowerCase() && (
                        <FilledIcon
                          name="check"
                          color={colorForeground(hex)}
                          size={26}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </CategoryFormSections>
          )}
          {error ? (
            <Text
              accessibilityRole="alert"
              className="font-sans text-base text-danger"
            >
              {error}
            </Text>
          ) : null}
        </ScrollView>
        <Animated.View
          entering={categoryEntrance(220)}
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 12,
            zIndex: 20,
          }}
        >
          <Button
            size="lg"
            isDisabled={isSaving || (!!editId && !existing)}
            onPress={save}
            className="rounded-full bg-accent"
          >
            <FilledIcon name="check" size={24} tone="accent-foreground" />
            <Button.Label>
              {isSaving ? "Saving…" : editId ? "Save category" : "Add category"}
            </Button.Label>
          </Button>
        </Animated.View>
      </KeyboardAvoidingView>
      {showIcons && (
        <IconPicker
          selected={{ name: draft.icon, pathData: draft.iconPath }}
          onClose={() => setShowIcons(false)}
          onSelect={(icon) => {
            setDraft((current) => ({
              ...current,
              icon: icon.name,
              iconPath: icon.pathData,
            }));
            setError("");
          }}
        />
      )}
    </SafeAreaView>
  );
}
