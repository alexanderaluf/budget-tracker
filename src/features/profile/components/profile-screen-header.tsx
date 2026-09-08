import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

import { FilledIcon } from "@/shared/ui/filled-icon";

type ProfileScreenHeaderProps = {
  title: string;
  onBack?: () => void;
};

export function ProfileScreenHeader({
  title,
  onBack,
}: ProfileScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center px-4 py-2">
      <Button
        accessibilityLabel="Go back"
        isIconOnly
        size="sm"
        variant="ghost"
        onPress={onBack ?? (() => router.back())}
      >
        <FilledIcon name="arrow-left" size={24} />
      </Button>
      <Text className="ml-2 font-manrope-bold text-xl text-foreground">
        {title}
      </Text>
    </View>
  );
}
