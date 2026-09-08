import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";

type ProfileHubActionsProps = {
  onAddProfile: () => void;
  onManageProfiles: () => void;
  onSettings: () => void;
};

type ActionRowProps = {
  icon: FilledIconName;
  label: string;
  onPress: () => void;
  isFirst?: boolean;
};

function ActionRow({ icon, label, onPress, isFirst }: ActionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      className={`h-[62px] flex-row items-center bg-surface px-4 ${
        isFirst ? "rounded-t-3xl" : "rounded-b-3xl"
      }`}
    >
      <View className="size-9 items-center justify-center rounded-full bg-surface-tertiary">
        <FilledIcon name={icon} size={22} />
      </View>
      <Text className="ml-3.5 font-manrope-semibold text-base text-foreground">
        {label}
      </Text>
    </Pressable>
  );
}

export function ProfileHubActions({
  onAddProfile,
  onManageProfiles,
  onSettings,
}: ProfileHubActionsProps) {
  const router = useRouter();
  return (
    <View className="gap-4">
      <View className="overflow-hidden rounded-3xl">
        <ActionRow
          icon="shopping"
          label="Categories"
          onPress={() => router.push("/categories")}
        />
      </View>
      <View className="gap-0.5 overflow-hidden rounded-3xl bg-background">
        <ActionRow
          icon="plus"
          isFirst
          label="Add another account"
          onPress={onAddProfile}
        />
        <ActionRow
          icon="account-cog"
          label="Manage accounts"
          onPress={onManageProfiles}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        className="h-[62px] flex-row items-center rounded-3xl bg-surface px-4"
        onPress={onSettings}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View className="size-9 items-center justify-center rounded-full bg-surface-tertiary">
          <FilledIcon name="cog" size={22} />
        </View>
        <Text className="ml-3.5 font-manrope-semibold text-base text-foreground">
          Settings
        </Text>
      </Pressable>
    </View>
  );
}
