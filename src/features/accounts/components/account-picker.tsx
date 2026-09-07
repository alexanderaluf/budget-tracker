import { Button, Input } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useDeferredValue,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { ACCOUNT_ICON_GROUPS } from "../account-options";
import { MATERIAL_ROUNDED_FILLED_ICONS } from "../data/material-rounded-filled-icons";
import { AccountIcon, type AccountIconSelection } from "./account-icon";

type PickerIcon = AccountIconSelection & { label: string; searchText: string };
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

export function AccountPicker({
  title,
  onClose,
  children,
}: PropsWithChildren<{
  title: string;
  onClose: () => void;
}>) {
  const insets = useSafeAreaInsets();
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
            backgroundColor: "#000000",
            paddingBottom: bottomInset,
            paddingTop: topInset,
          }}
        >
          <View className="flex-row items-center gap-3 px-5 py-3">
            <Button
              isIconOnly
              variant="ghost"
              accessibilityLabel="Close picker"
              onPress={onClose}
            >
              <FilledIcon name="arrow-left" color="#ededed" size={24} />
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

export function AccountIconPicker({
  selected,
  onSelect,
  onClose,
}: {
  selected: AccountIconSelection;
  onSelect: (icon: AccountIconSelection) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(selected);
  const deferredQuery = useDeferredValue(query);
  const sections = useMemo<PickerSection[]>(() => {
    const search = deferredQuery.trim().toLowerCase();
    const materialIcons = ALL_MATERIAL_PICKER_ICONS.filter(
      (icon) => !search || icon.searchText.includes(search),
    );

    return ACCOUNT_ICON_GROUPS.map((group) => {
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

      return { title: group.title, data: rowsOfSix(icons) };
    }).filter((section) => section.data.length > 0);
  }, [deferredQuery]);

  return (
    <AccountPicker title="Choose icon" onClose={onClose}>
      <View style={{ flex: 1 }}>
        <View className="px-5 pb-3">
          <Input
            accessibilityLabel="Search icons"
            placeholder="Search icons"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
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
            <View className="bg-black px-5 pb-2 pt-5">
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
                          draft.name === icon.name ? "#70d2eb" : "#343434",
                        backgroundColor:
                          draft.name === icon.name ? "#17343c" : "#0a0a0a",
                      },
                      Platform.OS === "android" && styles.androidIconButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AccountIcon
                      name={icon.name}
                      pathData={icon.pathData}
                      color={draft.name === icon.name ? "#70d2eb" : "#ededed"}
                      size={26}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <Text className="px-5 py-8 text-center text-muted">
              No icons found. Try a different search.
            </Text>
          }
        />
      </View>
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
        style={[
          styles.actionDock,
          {
            bottom:
              Platform.OS === "ios"
                ? Math.max(insets.bottom, 10) + 10
                : Math.max(insets.bottom, 10) - 20,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Done choosing an icon"
          accessibilityRole="button"
          onPress={() => {
            onSelect(draft);
            onClose();
          }}
          style={({ pressed }) => [
            styles.doneButton,
            pressed && styles.pressed,
          ]}
        >
          <FilledIcon name="check" color="#073442" size={24} />
          <Text className="font-manrope-bold text-base text-[#073442]">
            Done
          </Text>
        </Pressable>
      </View>
    </AccountPicker>
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
    backgroundColor: "#70d2eb",
    borderColor: "rgba(255, 255, 255, 0.18)",
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
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  pressed: {
    opacity: 0.72,
  },
});
