import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { ICON_COLORS, colorForeground } from "@/shared/icons/colors";
import { useAppThemeColors } from "@/shared/theme/app-theme";
import { FilledIcon } from "@/shared/ui/filled-icon";
import { BudgetField } from "./budget-ui";

function hueColor(hue: number, saturation: number) {
  const channel = (n: number) => {
    const k = (n + hue / 60) % 6;
    return Math.round(
      (1 - saturation * Math.max(0, Math.min(k, 4 - k, 1))) * 255,
    )
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`;
}
export function BudgetColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [tab, setTab] = useState("Primary"),
    c = useAppThemeColors();
  const palette =
    tab === "Accent"
      ? ICON_COLORS.map((color) => {
          const channels = [1, 3, 5].map((i) =>
            Math.round(parseInt(color.slice(i, i + 2), 16) * 0.6 + 255 * 0.4)
              .toString(16)
              .padStart(2, "0"),
          );
          return `#${channels.join("")}`;
        })
      : ICON_COLORS;
  function pick(x: number, y: number) {
    const dx = x - 120,
      dy = y - 120;
    onChange(
      hueColor(
        ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360,
        Math.min(1, Math.hypot(dx, dy) / 116),
      ),
    );
  }
  return (
    <View className="gap-5">
      <View
        accessibilityRole="tablist"
        className="flex-row rounded-2xl bg-surface p-1"
      >
        {["Primary", "Accent", "Wheel"].map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 12,
              backgroundColor: tab === t ? c.accent : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: tab === t ? colorForeground(c.accent) : c.foreground,
              }}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab !== "Wheel" ? (
        <View className="flex-row flex-wrap gap-3">
          {palette.map((color) => (
            <Pressable
              key={color}
              accessibilityRole="button"
              accessibilityLabel={`Choose ${color}`}
              accessibilityState={{ selected: value.toLowerCase() === color }}
              onPress={() => onChange(color)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: color,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {value.toLowerCase() === color && (
                <FilledIcon
                  name="check"
                  size={26}
                  color={colorForeground(color)}
                />
              )}
            </Pressable>
          ))}
        </View>
      ) : (
        <View
          style={{ alignSelf: "center", width: 240, height: 240 }}
          accessibilityLabel="Color wheel. A custom hex field is also available below."
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) =>
            pick(e.nativeEvent.locationX, e.nativeEvent.locationY)
          }
          onResponderMove={(e) =>
            pick(e.nativeEvent.locationX, e.nativeEvent.locationY)
          }
        >
          <Svg width={240} height={240} pointerEvents="none">
            <Defs>
              <RadialGradient id="saturation">
                <Stop offset="0" stopColor="white" stopOpacity={1} />
                <Stop offset="1" stopColor="white" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {Array.from({ length: 72 }, (_, i) => {
              const a = (i * 5 * Math.PI) / 180,
                b = ((i * 5 + 5.5) * Math.PI) / 180;
              return (
                <Path
                  key={i}
                  d={`M120 120 L${120 + 116 * Math.cos(a)} ${120 + 116 * Math.sin(a)} A116 116 0 0 1 ${120 + 116 * Math.cos(b)} ${120 + 116 * Math.sin(b)} Z`}
                  fill={hueColor(i * 5, 1)}
                />
              );
            })}
            <Circle cx={120} cy={120} r={116} fill="url(#saturation)" />
          </Svg>
        </View>
      )}
      <Text className="text-muted">Custom hex color</Text>
      <BudgetField
        accessibilityLabel="Custom hex color"
        placeholder="#5C6BC0"
        maxLength={7}
        autoCapitalize="characters"
        value={value}
        onChangeText={onChange}
      />
      {/^#[a-f\d]{6}$/i.test(value) && (
        <View
          style={{
            height: 44,
            borderRadius: 14,
            backgroundColor: value,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colorForeground(value) }}>
            {value.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}
