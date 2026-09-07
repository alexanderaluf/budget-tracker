import { Card, Chip } from "heroui-native";
import { Text, View } from "react-native";

import { formatCurrency } from "@/shared/lib/currency";
import { FilledIcon } from "@/shared/ui/filled-icon";

type AccountsSummaryCardProps = {
  assets: number;
  liabilities: number;
  netWorth: number;
  monthlyChangePercent: number;
};

export function AccountsSummaryCard({
  assets,
  liabilities,
  netWorth,
  monthlyChangePercent,
}: AccountsSummaryCardProps) {
  return (
    <Card className="border border-[#2d2d2d] bg-[#171717] p-0">
      <Card.Header className="flex-row items-center justify-between px-5 pt-5">
        <View className="flex-row items-center gap-2">
          <FilledIcon color="#70d2eb" name="shield-check" size={18} />
          <Text className="font-manrope-semibold text-xs uppercase tracking-widest text-muted">
            Total net worth
          </Text>
        </View>
        <Chip color="success" size="sm" variant="soft">
          <FilledIcon color="#70d2eb" name="arrow-top-right" size={15} />
          <Chip.Label className="font-manrope-bold">
            {monthlyChangePercent}%
          </Chip.Label>
        </Chip>
      </Card.Header>

      <Card.Body className="gap-6 px-5 pb-5 pt-3">
        <Text className="font-manrope-bold text-[34px] text-foreground">
          {formatCurrency(netWorth)}
        </Text>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-lg bg-[#202020] p-3">
            <Text className="font-sans text-xs text-muted">Assets</Text>
            <Text className="mt-1 font-manrope-bold text-base text-foreground">
              {formatCurrency(assets)}
            </Text>
          </View>
          <View className="flex-1 rounded-lg bg-[#202020] p-3">
            <Text className="font-sans text-xs text-muted">Liabilities</Text>
            <Text className="mt-1 font-manrope-bold text-base text-foreground">
              {formatCurrency(liabilities)}
            </Text>
          </View>
        </View>
      </Card.Body>
    </Card>
  );
}
