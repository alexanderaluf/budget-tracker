import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppThemeColors } from "@/shared/theme/app-theme";

import { ProfileList } from "./components/profile-list";
import { ProfileScreenHeader } from "./components/profile-screen-header";
import { useProfiles } from "./profile-provider";
import type { UserProfile } from "./types";

export function ManageProfilesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppThemeColors();
  const { profiles, activeProfileId, selectProfile } = useProfiles();

  function openEditor(profile?: UserProfile) {
    router.push({
      pathname: "/profile/user",
      params: profile
        ? { mode: "edit", profileId: profile.id }
        : { mode: "create" },
    });
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ProfileScreenHeader title={t("profile.manage.title")} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <ProfileList
          activeProfileId={activeProfileId}
          profiles={profiles}
          onCreate={() => openEditor()}
          onEdit={openEditor}
          onSelect={selectProfile}
        />
      </ScrollView>
    </SafeAreaView>
  );
}