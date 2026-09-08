import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalData } from "@/data/local-data-provider";
import { selectAccounts } from "@/data/selectors/document-selectors";
import { AccountCard } from "./components/account-card";

export function AccountsScreen() {
  const { document, paymentError, reconcileCardPayments } = useLocalData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accounts = selectAccounts(document);
  return (
    <FlatList
      data={accounts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 + insets.bottom, gap: 14 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
        <View className="flex-row items-center justify-between px-1 py-4">
          <Text accessibilityRole="header" className="font-manrope-bold text-2xl text-foreground">Accounts</Text>
          <Text className="font-sans text-sm text-muted">{accounts.length} accounts</Text>
        </View>
        {!!paymentError && (
          <View className="mb-3 gap-3 rounded-2xl bg-surface p-4">
            <Text accessibilityRole="alert" className="text-danger">{paymentError}</Text>
            <Pressable accessibilityRole="button" onPress={() => { void reconcileCardPayments(); }}>
              <Text className="font-manrope-bold text-accent">Retry card payments</Text>
            </Pressable>
          </View>
        )}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${item.name} account details`}
          onPress={() => router.push({ pathname: "/accounts/[id]", params: { id: item.id } })}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <AccountCard account={item} />
        </Pressable>
      )}
      ListEmptyComponent={<Text className="px-4 py-12 text-center font-sans text-base text-muted">No accounts yet. Tap the add account button below to create your first account.</Text>}
    />
  );
}
