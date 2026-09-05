import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

export function EmvChip() {
  return (
    <View className="h-7.5 w-10 overflow-hidden rounded-md">
      <LinearGradient
        colors={["#f0d9a0", "#cfa94f", "#e3c47e"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View className="flex-1 items-center justify-center">
        <View className="absolute left-0 right-0 h-[1.5px] bg-[#8a6b28]/55" />
        <View className="absolute bottom-0 top-0 left-2.75 w-[1.5px] bg-[#8a6b28]/55" />
        <View className="absolute bottom-0 top-0 right-2.75 w-[1.5px] bg-[#8a6b28]/55" />
        <View className="h-3.75 w-4.5 rounded-[3px] border-[1.5px] border-[#8a6b28]/55" />
      </View>
    </View>
  );
}
