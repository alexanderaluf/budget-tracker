import { Pressable, Text, View } from "react-native";

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
      className={`h-[62px] flex-row items-center bg-[#242424] px-4 ${
        isFirst ? "rounded-t-3xl" : "rounded-b-3xl"
      }`}
    >
      <View className="size-9 items-center justify-center rounded-full bg-[#2c2c2c]">
        <FilledIcon color="#f2f2f2" name={icon} size={22} />
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
  return (
    <View className="gap-4">
      <View className="gap-0.5 overflow-hidden rounded-3xl bg-black">
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
        className="h-[62px] flex-row items-center rounded-3xl bg-[#242424] px-4"
        onPress={onSettings}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View className="size-9 items-center justify-center rounded-full bg-[#2c2c2c]">
          <FilledIcon color="#f2f2f2" name="cog" size={22} />
        </View>
        <Text className="ml-3.5 font-manrope-semibold text-base text-foreground">
          Settings
        </Text>
      </Pressable>
    </View>
  );
}
