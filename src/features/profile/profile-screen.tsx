import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileAvatar } from "./components/profile-avatar";
import { ProfileHubActions } from "./components/profile-hub-actions";
import { ProfileScreenHeader } from "./components/profile-screen-header";
import { ProfileSettingsDialog } from "./components/profile-settings-dialog";
import { useProfiles } from "./profile-provider";

export function ProfileScreen() {
  const router = useRouter();
  const { activeProfile } = useProfiles();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const firstName = activeProfile.name.split(" ")[0];

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <ProfileScreenHeader title="Accounts" />

      <View className="flex-1 px-5 pt-10">
        <Animated.View
          entering={FadeInDown.duration(380).easing(
            Easing.bezier(0.22, 1, 0.36, 1),
          )}
          className="items-center"
        >
          <ProfileAvatar
            color={activeProfile.imageUri ? "#242424" : activeProfile.color}
            dimension={84}
            imageUri={activeProfile.imageUri}
            initials={activeProfile.initials}
            size="lg"
          />
          <Text className="mt-6 font-manrope-bold text-[26px] text-foreground">
            Hi, {firstName}!
          </Text>
          <Button
            size="md"
            variant="outline"
            className="mt-5 rounded-full border-[#b8b8b8] px-6"
            onPress={() =>
              router.push({
                pathname: "/profile/user",
                params: { mode: "edit", profileId: activeProfile.id },
              })
            }
          >
            <Button.Label className="font-manrope-bold text-[#70d2eb]">
              Manage your profile
            </Button.Label>
          </Button>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(90)
            .duration(380)
            .easing(Easing.bezier(0.22, 1, 0.36, 1))}
          className="mt-7"
        >
          <ProfileHubActions
            onAddProfile={() =>
              router.push({
                pathname: "/profile/user",
                params: { mode: "create" },
              })
            }
            onManageProfiles={() => router.push("/profile/manage")}
            onSettings={() => setIsSettingsOpen(true)}
          />
        </Animated.View>
      </View>

      <ProfileSettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </SafeAreaView>
  );
}
