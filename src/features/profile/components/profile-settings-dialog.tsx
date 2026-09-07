import { Button, Dialog } from "heroui-native";
import { ScrollView, Text, View } from "react-native";

import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";

import { BackupManagement } from "./backup-management";

type ProfileSettingsDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const settings = [
  { label: "Appearance", value: "Dark", icon: "weather-night" },
  { label: "Default currency", value: "USD", icon: "currency-usd" },
  { label: "Notifications", value: "Enabled", icon: "bell" },
] satisfies Array<{ label: string; value: string; icon: FilledIconName }>;

export function ProfileSettingsDialog({
  isOpen,
  onOpenChange,
}: ProfileSettingsDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="max-h-[85%] gap-5 border border-border bg-[#171717]">
          <Dialog.Close variant="ghost">
            <FilledIcon color="#f2f2f2" name="close" size={19} />
          </Dialog.Close>
          <View className="gap-1.5 pr-8">
            <Dialog.Title className="font-manrope-bold">Settings</Dialog.Title>
            <Dialog.Description>
              Preferences for the active profile.
            </Dialog.Description>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-5 pb-1">
              <View className="overflow-hidden rounded-lg border border-border bg-[#202020]">
                {settings.map((setting, index) => {
                  return (
                    <View
                      key={setting.label}
                      className={`flex-row items-center px-4 py-4 ${
                        index < settings.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      <FilledIcon
                        color="#70d2eb"
                        name={setting.icon}
                        size={20}
                      />
                      <Text className="ml-3 flex-1 font-manrope-semibold text-sm text-foreground">
                        {setting.label}
                      </Text>
                      <Text className="font-sans text-xs text-muted">
                        {setting.value}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View className="gap-2">
                <Text className="font-manrope-bold text-sm text-foreground">
                  Data & backup
                </Text>
                <Text className="font-sans text-xs leading-4 text-muted">
                  Records remain on this device. Export backups whenever you
                  want a portable copy.
                </Text>
                <BackupManagement />
              </View>
            </View>
          </ScrollView>

          <Button onPress={() => onOpenChange(false)}>
            <Button.Label>Done</Button.Label>
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
