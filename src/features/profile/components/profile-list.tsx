import { Button, Card } from "heroui-native";
import { Pressable, Text, View } from "react-native";

import { FilledIcon } from "@/shared/ui/filled-icon";

import type { UserProfile } from "../types";
import { ProfileAvatar } from "./profile-avatar";

type ProfileListProps = {
  profiles: UserProfile[];
  activeProfileId: string;
  onSelect: (profileId: string) => void;
  onEdit: (profile: UserProfile) => void;
  onCreate: () => void;
};

export function ProfileList({
  profiles,
  activeProfileId,
  onSelect,
  onEdit,
  onCreate,
}: ProfileListProps) {
  return (
    <Card className="border border-border bg-surface p-0">
      <Card.Header className="flex-row items-center justify-between px-5 pb-2 pt-5">
        <View>
          <Card.Title className="font-manrope-bold text-lg text-foreground">
            Profiles
          </Card.Title>
          <Card.Description className="mt-1 font-sans text-muted">
            Select the budget you want to manage
          </Card.Description>
        </View>
        <Button
          accessibilityLabel="Create profile"
          isIconOnly
          size="sm"
          variant="primary"
          onPress={onCreate}
        >
          <FilledIcon color="#073442" name="plus" size={20} />
        </Button>
      </Card.Header>

      <Card.Body className="px-5 pb-3">
        {profiles.map((profile, index) => {
          const isActive = profile.id === activeProfileId;

          return (
            <Pressable
              key={profile.id}
              accessibilityLabel={`Select ${profile.name}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`flex-row items-center py-3 ${
                index < profiles.length - 1 ? "border-b border-border" : ""
              }`}
              onPress={() => onSelect(profile.id)}
            >
              <ProfileAvatar
                color={profile.color}
                imageUri={profile.imageUri}
                initials={profile.initials}
                size="md"
              />
              <View className="ml-3 flex-1">
                <Text className="font-manrope-bold text-sm text-foreground">
                  {profile.name}
                </Text>
                <Text className="mt-0.5 font-sans text-xs text-muted">
                  {profile.role}
                </Text>
              </View>

              {isActive ? (
                <View className="mr-2 size-7 items-center justify-center rounded-full bg-[#17343c]">
                  <FilledIcon color="#70d2eb" name="check" size={18} />
                </View>
              ) : null}
              <Button
                accessibilityLabel={`Edit ${profile.name}`}
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => onEdit(profile)}
              >
                <FilledIcon color="#a3a3a3" name="pencil" size={18} />
              </Button>
            </Pressable>
          );
        })}
      </Card.Body>
    </Card>
  );
}
