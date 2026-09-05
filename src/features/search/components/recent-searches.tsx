import { Chip } from "heroui-native";
import { Clock3 } from "lucide-react-native";
import { Text, View } from "react-native";

type RecentSearchesProps = {
  queries: string[];
  onSelect: (query: string) => void;
};

export function RecentSearches({ queries, onSelect }: RecentSearchesProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Clock3 color="#a3a3a3" size={16} strokeWidth={2.2} />
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
