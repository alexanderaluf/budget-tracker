import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, Text, View } from "react-native";

import { FilledIcon } from "@/shared/ui/filled-icon";

import { ProfileAvatar } from "./profile-avatar";

type ProfilePhotoPickerProps = {
  color: string;
  imageUri?: string;
  initials: string;
  onChange: (imageUri: string) => void;
};

export function ProfilePhotoPicker({
  color,
  imageUri,
  initials,
  onChange,
}: ProfilePhotoPickerProps) {
  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo access required",
        "Allow photo access to choose a profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) {
      onChange(result.assets[0].uri);
    }
  }

  return (
    <View className="items-center">
      <Pressable
        accessibilityLabel="Choose profile photo"
        accessibilityRole="button"
        onPress={pickPhoto}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
      >
        <ProfileAvatar
          color={imageUri ? "#242424" : color}
          dimension={92}
          imageUri={imageUri}
          initials={initials}
          size="lg"
        />
        <View className="absolute bottom-0 right-0 size-9 items-center justify-center rounded-full border-4 border-black bg-[#70d2eb]">
          <FilledIcon color="#073442" name="camera" size={19} />
        </View>
      </Pressable>
      <Text className="mt-4 font-sans text-sm text-muted">
        Profile photo (optional)
      </Text>
    </View>
  );
}
