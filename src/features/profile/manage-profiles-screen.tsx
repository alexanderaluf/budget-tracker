import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileList } from "./components/profile-list";
import { ProfileScreenHeader } from "./components/profile-screen-header";
import { useProfiles } from "./profile-provider";
import type { UserProfile } from "./types";

export function ManageProfilesScreen() {
  const router = useRouter();
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
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <ProfileScreenHeader title="Manage accounts" />
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