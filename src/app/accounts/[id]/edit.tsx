import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalData } from "@/data/local-data-provider";
import { selectAccounts } from "@/data/selectors/document-selectors";
import { AccountCreateScreen } from "@/features/accounts/account-create-screen";

export default function EditAccountRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { document } = useLocalData();
  const router = useRouter();
  if (!selectAccounts(document).some((account) => account.id === id)) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black", padding: 24 }}>
      <Text className="text-foreground">Account not found.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.dismissTo("/accounts")} className="py-6"><Text className="text-accent">Back to accounts</Text></Pressable>
    </SafeAreaView>
  );
  return <AccountCreateScreen key={id} editId={id} />;
}
