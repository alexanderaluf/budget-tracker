import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalData } from "@/data/local-data-provider";
import { selectAccounts } from "@/data/selectors/document-selectors";
import { AccountCreateScreen } from "@/features/accounts/account-create-screen";
import { useAppThemeColors } from "@/shared/theme/app-theme";
import { Text } from "@/shared/ui/app-text";

export default function EditAccountRoute() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { document } = useLocalData();
  const router = useRouter();
  const theme = useAppThemeColors();
  if (!selectAccounts(document).some((account) => account.id === id))
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.background,
          padding: 24,
        }}
      >
        <Text className="text-foreground">
          {t("accounts.common.accountNotFound")}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="py-6"
          onPress={() => router.dismissTo("/accounts")}
        >
          <Text className="text-accent">
            {t("accounts.common.backToAccounts")}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  return <AccountCreateScreen key={id} editId={id} />;
}
