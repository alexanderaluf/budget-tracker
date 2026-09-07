import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Input } from "heroui-native";
import { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FilledIcon } from "@/shared/ui/filled-icon";

import { CurrencySelectorSheet } from "./components/currency-selector-sheet";
import { ProfilePhotoPicker } from "./components/profile-photo-picker";
import { ProfileScreenHeader } from "./components/profile-screen-header";
import { currencies } from "./data/currencies-data";
import { getProfileInitials } from "./lib/profile-utils";
import { useProfiles } from "./profile-provider";

export function UserEditorScreen() {
  const router = useRouter();
  const { mode, profileId } = useLocalSearchParams<{
    mode?: "create" | "edit";
    profileId?: string;
  }>();
  const { profiles, createProfile, updateProfile } = useProfiles();
  const profile = profiles.find((item) => item.id === profileId);
  const isEditing = mode !== "create" && Boolean(profile);
  const defaultCurrency =
    currencies.find(
      (currency) => currency.code === profile?.currencyCode.toUpperCase(),
    ) ??
    (profile
      ? {
          code: profile.currencyCode,
          name: profile.currencyName,
          symbol: profile.currencySymbol,
        }
      : undefined);
  const [name, setName] = useState(profile?.name ?? "");
  const [imageUri, setImageUri] = useState(profile?.imageUri);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const canSubmit = name.trim().length > 0 && currency != null;

  async function handleSubmit() {
    if (!canSubmit || !currency || isSaving) return;

    const values = {
      name: name.trim(),
      email:
        profile?.email ??
        `${name.trim().toLowerCase().replace(/\s+/g, ".")}@local.profile`,
      role: profile?.role ?? "Personal",
      imageUri,
      currencyCode: currency.code,
      currencyName: currency.name,
      currencySymbol: currency.symbol,
    };

    setIsSaving(true);
    try {
      if (isEditing && profile) {
        await updateProfile(profile.id, values);
      } else {
        await createProfile(values);
      }
      router.back();
    } catch {
      Alert.alert(
        "Unable to save profile",
        "Your changes could not be saved. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ProfileScreenHeader title="User" />

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-8 px-5 pb-8 pt-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ProfilePhotoPicker
            color={profile?.color ?? "#242424"}
            imageUri={imageUri}
            initials={getProfileInitials(name) || "U"}
            onChange={setImageUri}
          />

          <View className="gap-3">
            <Text className="font-manrope-medium text-[15px] text-foreground">
              What should we call you?
            </Text>
            <View className="relative justify-center">
              <FilledIcon
                color="#a3a3a3"
                name="account"
                size={20}
                style={{ position: "absolute", left: 18, zIndex: 2 }}
              />
              <Input
                autoCapitalize="words"
                className="h-[52px] border border-border bg-transparent pl-14 font-manrope-semibold text-base"
                placeholder="User Name"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View className="gap-3">
            <Text className="font-manrope-semibold text-base text-[#70d2eb]">
              Currency
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                currency
                  ? `Main currency: ${currency.name}, ${currency.code}`
                  : "Choose main currency"
              }
              accessibilityState={{
                expanded: isCurrencyOpen,
                disabled: isSaving,
              }}
              disabled={isSaving}
              className="min-h-[64px] flex-row items-center rounded-2xl border border-border px-4"
              onPress={() => {
                Keyboard.dismiss();
                setIsCurrencyOpen(true);
              }}
            >
              {currency ? (
                <View className="size-9.5 items-center justify-center rounded-full bg-[#70d2eb]">
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    className="px-1 font-manrope-bold text-base text-[#073442]"
                  >
                    {currency.symbol}
                  </Text>
                </View>
              ) : null}
              <View className={`${currency ? "ml-4" : "ml-1"} flex-1`}>
                <Text className="font-manrope-semibold text-base text-foreground">
                  {currency?.name ?? "Currency"}
                </Text>
                <Text className="mt-0.5 font-sans text-sm leading-5 text-muted">
                  {currency?.code ??
                    "Choose your preferred currency for transactions"}
                </Text>
              </View>
              <FilledIcon color="#a3a3a3" name="chevron-right" size={24} />
            </Pressable>
            <Text className="font-sans text-sm leading-5 text-muted">
              Your profile and main currency are saved on this device when you
              {isEditing ? " update your profile." : " add your profile."}
            </Text>
          </View>
        </ScrollView>

        <View className="px-5 pb-2 pt-3">
          <Button
            isDisabled={!canSubmit || isSaving}
            size="lg"
            className="h-[50px] rounded-full bg-[#70d2eb]"
            onPress={handleSubmit}
          >
            <Button.Label className="font-manrope-bold text-base text-[#073442]">
              {isSaving ? "Saving..." : isEditing ? "Update User" : "Add User"}
            </Button.Label>
          </Button>
        </View>
      </KeyboardAvoidingView>

      <CurrencySelectorSheet
        currencies={currencies}
        isOpen={isCurrencyOpen}
        selectedCode={currency?.code ?? ""}
        onOpenChange={setIsCurrencyOpen}
        onSelect={setCurrency}
      />
    </SafeAreaView>
  );
}
