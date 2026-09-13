import { Button, Input } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useDeferredValue,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { Text } from "@/shared/ui/app-text";
import { useAppLocalization } from "@/localization/localization-provider";
import { ICON_GROUPS } from "@/shared/icons/icon-options";
import { MATERIAL_ROUNDED_FILLED_ICONS } from "@/shared/icons/material-rounded-filled-icons";
import { RecordIcon, type IconSelection } from "./record-icon";
import {
  colorWithAlpha,
  useAppThemeColors,
} from "@/shared/theme/app-theme";

type PickerIcon = IconSelection & { label: string; searchText: string };
type PickerSection = { title: string; data: PickerIcon[][] };

const ALL_MATERIAL_PICKER_ICONS: PickerIcon[] =
  MATERIAL_ROUNDED_FILLED_ICONS.map((icon) => ({
    label: icon.label,
    name: `material:${icon.name}`,
    pathData: icon.pathData,
    searchText: icon.searchText,
  }));
const materialPickerIconsByName = new Map(
  ALL_MATERIAL_PICKER_ICONS.map((icon) => [icon.name, icon]),
);

function rowsOfSix(icons: PickerIcon[]) {
  const rows: PickerIcon[][] = [];
  for (let index = 0; index < icons.length; index += 6) {
    rows.push(icons.slice(index, index + 6));
  }
  return rows;
}

export function PickerModal({
  title,
  onClose,
  children,
}: PropsWithChildren<{
  title: string;
  onClose: () => void;
}>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useAppThemeColors();
  const topInset = Math.max(insets.top, initialWindowMetrics?.insets.top ?? 0);
  const bottomInset = Math.max(
    insets.bottom,
    initialWindowMetrics?.insets.bottom ?? 0,
  );

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            paddingBottom: bottomInset,
            paddingTop: topInset,
          }}
        >
          <View className="flex-row items-center gap-3 px-5 py-3">
            <Button
              isIconOnly
              variant="ghost"
              accessibilityLabel={t("iconPicker.close")}
              onPress={onClose}
            >
              <FilledIcon name="arrow-left" size={24} />
            </Button>
            <View className="flex-1">
              <Text
                accessibilityRole="header"
                className="font-manrope-bold text-xl text-foreground"
              >
                {title}
              </Text>
            </View>
          </View>
          {children}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

export function IconPicker({
  selected,
  onSelect,
  onClose,
}: {
  selected: IconSelection;
  onSelect: (icon: IconSelection) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { direction } = useAppLocalization();
  const insets = useSafeAreaInsets();
  const colors = useAppThemeColors();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(selected);
  const deferredQuery = useDeferredValue(query);
  const sections = useMemo<PickerSection[]>(() => {
    const search = deferredQuery.trim().toLowerCase();
    const materialIcons = ALL_MATERIAL_PICKER_ICONS.filter(
      (icon) => !search || icon.searchText.includes(search),
    );

    return ICON_GROUPS.map((group) => {
      const curatedIcons: PickerIcon[] = group.icons
        .flatMap((icon) => {
          const materialIcon = materialPickerIconsByName.get(icon.name);
          if (icon.name.startsWith("material:") && !materialIcon) return [];
          return [
            {
              label: icon.label,
              name: icon.name,
              pathData: materialIcon?.pathData ?? null,
              searchText:
                (materialIcon
                  ? `${group.title} ${materialIcon.searchText}`.toLowerCase()
                  : null) ?? `${group.title} ${icon.label}`.toLowerCase(),
            },
          ];
        })
        .filter((icon) => !search || icon.searchText.includes(search));
      const curatedNames = new Set(curatedIcons.map((icon) => icon.name));
      const icons =
        group.title === "More"
          ? [
              ...curatedIcons,
              ...materialIcons.filter((icon) => !curatedNames.has(icon.name)),
            ]
          : curatedIcons;

      const groupKey =
        group.title === "Money & accounts"
          ? "moneyAccounts"
          : group.title === "Everyday spending"
            ? "everydaySpending"
            : group.title === "Goals & interests"
              ? "goalsInterests"
              : "more";

      return {
        title: t(`iconPicker.groups.${groupKey}`),
        data: rowsOfSix(icons),
      };
    }).filter((section) => section.data.length > 0);
  }, [deferredQuery, t]);

  return (
    <PickerModal title={t("iconPicker.title")} onClose={onClose}>
      <View style={{ flex: 1 }}>
        <View className="px-5 pb-3">
          <Input
            accessibilityLabel={t("iconPicker.search")}
            placeholder={t("iconPicker.search")}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            style={{
              direction,
              textAlign: direction === "rtl" ? "right" : "left",
              writingDirection: direction,
            }}
          />
        </View>
        <SectionList<PickerIcon[], PickerSection>
          sections={sections}
          extraData={draft.name}
          initialNumToRender={10}
          keyExtractor={(row) => row.map((icon) => icon.name).join("|")}
          keyboardShouldPersistTaps="handled"
          maxToRenderPerBatch={12}
          removeClippedSubviews={Platform.OS === "android"}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          style={{ flex: 1 }}
          windowSize={7}
          contentContainerStyle={{ paddingBottom: 104 + insets.bottom }}
          renderSectionHeader={({ section }) => (
            <View className="bg-background px-5 pb-2 pt-5">
              <Text className="font-manrope-semibold text-base text-accent">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item: row }) => (
            <View className="flex-row px-3 py-1.5">
              {row.map((icon) => (
                <View key={icon.name} style={styles.iconSlot}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityLabel={icon.label}
                    accessibilityState={{ checked: draft.name === icon.name }}
                    onPress={() =>
                      setDraft({ name: icon.name, pathData: icon.pathData })
                    }
                    className="size-14 items-center justify-center rounded-full border-2"
                    style={({ pressed }) => [
                      {
                        borderColor:
                          draft.name === icon.name ? colors.accent : colors.border,
                        backgroundColor:
                          draft.name === icon.name
                            ? colorWithAlpha(colors.accent, 0.14)
                            : colors.surface,
                      },
                      Platform.OS === "android" && styles.androidIconButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <RecordIcon
                      name={icon.name}
                      pathData={icon.pathData}
                      color={
                        draft.name === icon.name
                          ? colors.accent
                          : colors.foreground
                      }
                      size={26}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <Text className="px-5 py-8 text-center text-muted">
              {t("iconPicker.empty")}
            </Text>
          }
        />
      </View>
      <LinearGradient
        colors={[
          colorWithAlpha(colors.background, 0),
          colorWithAlpha(colors.background, 0.78),
          colors.background,
        ]}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.58, 1]}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        style={[styles.bottomScrim, { height: 104 + insets.bottom }]}
      />
      <View
        pointerEvents="box-none"
        style={[
          styles.actionDock,
          {
            bottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <Pressable
          accessibilityLabel={t("iconPicker.doneAccessibility")}
          accessibilityRole="button"
          onPress={() => {
            onSelect(draft);
            onClose();
          }}
          style={({ pressed }) => [
            styles.doneButton,
            {
              backgroundColor: colors.accent,
              borderColor: colorWithAlpha(colors.foreground, 0.18),
            },
            pressed && styles.pressed,
          ]}
        >
          <FilledIcon name="check" size={24} tone="accent-foreground" />
          <Text className="font-manrope-bold text-base text-accent-foreground">
            {t("iconPicker.done")}
          </Text>
        </Pressable>
      </View>
    </PickerModal>
  );
}

const styles = StyleSheet.create({
  iconSlot: {
    alignItems: "center",
    width: "16.666667%",
  },
  bottomScrim: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
  actionDock: {
    left: 0,
    paddingHorizontal: 12,
    position: "absolute",
    right: 0,
    zIndex: 20,
  },
  doneButton: {
    alignItems: "center",
    borderRadius: 29,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 58,
    justifyContent: "center",
    overflow: "hidden",
  },
  androidIconButton: {
    alignItems: "center",
    borderRadius: 30,
    borderWidth: 1.5,
    aspectRatio: 1,
    height: undefined,
    justifyContent: "center",
    width: "92%",
    maxWidth: 60,
  },
  pressed: {
    opacity: 0.72,
  },
});
