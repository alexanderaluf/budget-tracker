import { Chip } from "heroui-native";
import { Text, View } from "react-native";

import { FilledIcon } from "@/shared/ui/filled-icon";

type RecentSearchesProps = {
  queries: string[];
  onSelect: (query: string) => void;
};

export function RecentSearches({ queries, onSelect }: RecentSearchesProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <FilledIcon name="clock" size={17} tone="muted" />
        <Text className="font-manrope-bold text-sm text-foreground">
          Recent searches
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {queries.map((query) => (
          <Chip
            key={query}
            color="default"
            variant="secondary"
            onPress={() => onSelect(query)}
          >
            <Chip.Label className="font-manrope-semibold">{query}</Chip.Label>
          </Chip>
        ))}
      </View>
    </View>
  );
}
