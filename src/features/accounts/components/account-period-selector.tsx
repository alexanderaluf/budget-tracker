import { GlassSegmentedControl } from "@/shared/ui/glass-segmented-control";
import type { RefObject } from "react";
import type { View } from "react-native";
import type { AccountPeriod } from "../types";

const periods: AccountPeriod[] = ["Daily", "Weekly", "Monthly", "Yearly"];
const periodOptions = periods.map((period) => ({
  label: period,
  value: period,
}));

export function AccountPeriodSelector({
  blurTarget,
  value,
  onChange,
}: {
  blurTarget?: RefObject<View | null>;
  value: AccountPeriod;
  onChange: (value: AccountPeriod) => void;
}) {
  return (
    <GlassSegmentedControl
      accessibilityLabel="Transaction period"
      blurTarget={blurTarget}
      onChange={onChange}
      options={periodOptions}
      value={value}
    />
  );
}
