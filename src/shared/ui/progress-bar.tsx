import { View } from "react-native";

type ProgressBarProps = {
  value: number;
  color?: string;
  height?: number;
};

export function ProgressBar({
  value,
  color = "#25845f",
  height = 7,
}: ProgressBarProps) {
  const normalizedValue = Math.min(Math.max(value, 0), 1);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: normalizedValue * 100 }}
      className="w-full overflow-hidden rounded-full bg-black/10"
      style={{ height }}
    >
      <View
        className="h-full rounded-full"
        style={{ backgroundColor: color, width: `${normalizedValue * 100}%` }}
      />
    </View>
  );
}
