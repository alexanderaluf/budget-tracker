import { Card } from "heroui-native";
import { Text, View } from "react-native";

import { formatSignedCurrency } from "@/shared/lib/currency";
import { FilledIcon } from "@/shared/ui/filled-icon";

import type { SearchResult } from "../types";

type SearchResultsProps = {
  query: string;
  results: SearchResult[];
};

export function SearchResults({ query, results }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <Card className="items-center border border-border bg-surface px-6 py-10">
        <FilledIcon color="#70d2eb" name="magnify-close" size={30} />
        <Text className="mt-4 font-manrope-bold text-base text-foreground">
          No matching transactions
        </Text>
        <Text className="mt-1 text-center font-sans text-sm text-muted">
          Try a merchant, category, or account name.
        </Text>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-surface p-0">
      <Card.Header className="flex-row items-center justify-between px-5 pb-2 pt-5">
        <Card.Title className="font-manrope-bold text-lg text-foreground">
          {query ? "Results" : "All activity"}
        </Card.Title>
        <Text className="font-manrope-semibold text-xs text-muted">
          {results.length} {results.length === 1 ? "match" : "matches"}
        </Text>
      </Card.Header>

      <Card.Body className="px-5 pb-3">
        {results.map((result, index) => {
          return (
            <View
              key={result.id}
              className={`flex-row items-center py-4 ${
                index < results.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <View
                className="size-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: result.iconBackground }}
              >
                <FilledIcon color={result.color} name={result.icon} size={21} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-manrope-bold text-sm text-foreground">
                  {result.title}
                </Text>
                <Text className="mt-0.5 font-sans text-xs text-muted">
                  {result.category} · {result.account}
                </Text>
              </View>
              <View className="ml-2 items-end">
                <Text
                  className={`font-manrope-bold text-sm ${
                    result.amount > 0 ? "text-[#70d2eb]" : "text-foreground"
                  }`}
                >
                  {formatSignedCurrency(result.amount)}
                </Text>
                <Text className="mt-0.5 font-sans text-[10px] text-muted">
                  {result.date}
                </Text>
              </View>
            </View>
          );
        })}
      </Card.Body>
    </Card>
  );
}
