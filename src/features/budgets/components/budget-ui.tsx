import { Button } from "heroui-native";
import { useRouter } from "expo-router";
import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import type { Budget } from "@/data/selectors/budget-selectors";
import { useAppThemeColors } from "@/shared/theme/app-theme";
import { FilledIcon, type FilledIconName } from "@/shared/ui/filled-icon";
import { RecordIcon } from "@/shared/ui/record-icon";
import { colorForeground } from "@/shared/icons/colors";
import { formatCurrency } from "@/shared/lib/currency";

export const TYPE_LABELS = ["Expense", "Income", "Transfer"] as const;
export const trackedLabel = (type: number) =>
  type === 1 ? "Earned" : type === 2 ? "Transferred" : "Spent";
export function BudgetHeader({
  title,
  children,
  disabled = false,
}: PropsWithChildren<{ title: string; disabled?: boolean }>) {
  const router = useRouter();
  return (
    <View className="flex-row items-center gap-2 px-3 py-2">
      <Button
        variant="ghost"
        isIconOnly
        isDisabled={disabled}
        accessibilityLabel="Go back"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      >
        <FilledIcon name="arrow-left" size={26} />
      </Button>
      <Text
        accessibilityRole="header"
        className="flex-1 font-manrope-bold text-2xl text-foreground"
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
export function BudgetPanel({ children }: PropsWithChildren) {
  return (
    <View className="gap-4 rounded-[28px] border border-border bg-surface p-5">
      {children}
    </View>
  );
}
export function BudgetField(props: TextInputProps) {
  const c = useAppThemeColors();
  return (
    <TextInput
      placeholderTextColor={c.muted}
      {...props}
      style={[
        {
          minHeight: 58,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: c.surface,
          color: c.foreground,
          fontFamily: "Manrope_400Regular",
          fontSize: 17,
          borderWidth: 1,
          borderColor: c.border,
        },
        props.style,
      ]}
    />
  );
}
export function BudgetOption({
  title,
  description,
  selected,
  onPress,
  icon,
  children,
}: {
  title: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
  icon?: FilledIconName;
  children?: ReactNode;
}) {
  const c = useAppThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        borderWidth: 2,
        borderColor: selected ? c.accent : "transparent",
        backgroundColor: c.surface,
        borderRadius: 24,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
      })}
    >
      {icon && <FilledIcon name={icon} size={25} tone="accent" />}
      {children}
      <View style={{ flex: 1 }}>
        <Text
          className="font-manrope-semibold text-lg"
          style={{ color: selected ? c.accent : c.foreground }}
        >
          {title}
        </Text>
        {description ? (
          <Text className="mt-1 font-sans text-sm leading-6 text-muted">
            {description}
          </Text>
        ) : null}
      </View>
      {selected !== undefined && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selected ? c.accent : c.muted,
            backgroundColor: selected ? c.accent : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected && (
            <FilledIcon name="check" size={17} tone="accent-foreground" />
          )}
        </View>
      )}
    </Pressable>
  );
}
export function BudgetToggle({
  title,
  description,
  value,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const c = useAppThemeColors();
  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="flex-1">
        <Text className="font-manrope-semibold text-lg text-foreground">
          {title}
        </Text>
        <Text className="mt-1 font-sans text-sm leading-5 text-muted">
          {description}
        </Text>
      </View>
      <Switch
        accessibilityLabel={title}
        disabled={disabled}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: c.accent, false: c.border }}
      />
    </View>
  );
}
// A separate native modal keeps the keyboard, Android back, and focus inside each sheet.
export function BudgetSheet({
  title,
  children,
  onClose,
  onDone,
  busy = false,
}: PropsWithChildren<{
  title: string;
  onClose: () => void;
  onDone?: () => void;
  busy?: boolean;
}>) {
  const c = useAppThemeColors(),
    insets = useSafeAreaInsets();
  return (
    <Modal
      transparent
      visible
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => !busy && onClose()}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,.64)",
          paddingTop: insets.top + 16,
        }}
      >
        <Pressable
          accessibilityLabel="Dismiss sheet"
          onPress={() => !busy && onClose()}
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
        <View
          accessibilityViewIsModal
          style={{
            height: "82%",
            maxHeight: "100%",
            backgroundColor: c.background,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            borderWidth: 1,
            borderColor: c.border,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <View
            style={{
              width: 38,
              height: 4,
              borderRadius: 2,
              backgroundColor: c.muted,
              opacity: 0.4,
              alignSelf: "center",
              marginTop: 10,
            }}
          />
          <Text
            accessibilityRole="header"
            className="px-5 pb-4 pt-4 font-manrope-bold text-2xl text-foreground"
          >
            {title}
          </Text>
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingBottom: 18,
              gap: 10,
            }}
          >
            {children}
          </ScrollView>
          <View className="flex-row justify-end gap-3 px-5 pt-3">
            <Button variant="ghost" isDisabled={busy} onPress={onClose}>
              <Button.Label>Cancel</Button.Label>
            </Button>
            {onDone && (
              <Button isDisabled={busy} onPress={onDone}>
                <Button.Label>Done</Button.Label>
              </Button>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function BudgetBadge({
  budget,
}: {
  budget: { icon: string; iconPath: string | null; color: string };
}) {
  return (
    <View
      style={{
        backgroundColor: budget.color,
        width: 54,
        height: 54,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <RecordIcon
        name={budget.icon}
        pathData={budget.iconPath}
        color={colorForeground(budget.color)}
        size={29}
      />
    </View>
  );
}
export function BudgetProgress({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
  const c = useAppThemeColors();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.min(100, Math.round(percent)),
      }}
      style={{
        height: 8,
        backgroundColor: c.border,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: 8,
          width: `${Math.min(100, Math.max(0, percent))}%`,
          backgroundColor: color,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
export function BudgetSummary({
  budget,
  compact = false,
}: {
  budget: Budget;
  compact?: boolean;
}) {
  const b = budget;
  const money = (v: number) =>
    `${v < 0 ? "−" : ""}${formatCurrency(v, b.currencyCode)}`;
  return (
    <BudgetPanel>
      <View className="flex-row items-center gap-3">
        <BudgetBadge budget={b} />
        <View className="flex-1 gap-1">
          <Text className="font-manrope-bold text-xl text-foreground">
            {b.name}
          </Text>
          <Text
            className="font-manrope-medium text-xs"
            style={{ color: b.color }}
          >
            {b.period} · {b.budgetType} · {b.budgetMode}
          </Text>
        </View>
        <Text style={{ color: b.color }} className="font-manrope-bold">
          {Math.round(b.percent)}%
        </Text>
      </View>
      {!compact && (
        <View className="flex-row justify-between gap-3">
          <Text className="text-muted">
            {TYPE_LABELS[b.transactionType]} budget
          </Text>
          <Text className="text-foreground">
            {b.transactionType === 1
              ? b.percent >= 100
                ? "Goal reached"
                : "In progress"
              : b.remaining < 0
                ? "Over budget"
                : "Within budget"}
          </Text>
        </View>
      )}
      <View className="flex-row justify-between gap-3">
        <View>
          <Text className="mb-1 text-muted">
            {trackedLabel(b.transactionType)}
          </Text>
          <Text className="font-manrope-semibold text-xl text-foreground">
            {money(b.tracked)}
          </Text>
        </View>
        <View>
          <Text className="mb-1 text-muted">
            {b.transactionType === 1 ? "Goal" : "Budget"}
          </Text>
          <Text className="font-manrope-semibold text-xl text-foreground">
            {money(b.limit)}
          </Text>
        </View>
      </View>
      <BudgetProgress percent={b.percent} color={b.color} />
      {!compact && (
        <>
          <Text className="text-muted">
            {b.remaining < 0 ? "Above target" : "Remaining"}{" "}
            <Text className="font-manrope-semibold text-foreground">
              {money(Math.abs(b.remaining))}
            </Text>
          </Text>
          <Text className="text-sm leading-6" style={{ color: b.color }}>
            {!b.active
              ? "Outside this budget’s date range"
              : b.transactionType === 1
                ? `Aim for ${money(b.dailyAllowance)}/day for ${b.daysLeft} more days`
                : `You can ${b.transactionType === 2 ? "transfer" : "spend"} ${money(b.dailyAllowance)}/day for ${b.daysLeft} more days`}
          </Text>
          {b.rollover > 0 && (
            <Text className="text-sm text-muted">
              Includes {money(b.rollover)} carried forward
            </Text>
          )}
        </>
      )}
    </BudgetPanel>
  );
}
export function BudgetRing({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
  const c = useAppThemeColors();
  const length = 2 * Math.PI * 62;
  return (
    <View
      style={{
        width: 154,
        height: 154,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={154} height={154} style={{ position: "absolute" }}>
        <Circle
          cx={77}
          cy={77}
          r={62}
          stroke={c.border}
          strokeWidth={19}
          fill="none"
        />
        <Circle
          cx={77}
          cy={77}
          r={62}
          stroke={color}
          strokeWidth={19}
          fill="none"
          strokeDasharray={`${(length * Math.min(100, percent)) / 100} ${length}`}
          rotation={-90}
          origin="77,77"
        />
      </Svg>
      <Text className="font-manrope-bold text-3xl text-foreground">
        {Math.round(percent)}%
      </Text>
      <Text className="text-muted">Tracked</Text>
    </View>
  );
}
export function BudgetChart({ budget: b }: { budget: Budget }) {
  const c = useAppThemeColors();
  const max = Math.max(b.limit, b.tracked, 1) * 1.2;
  const x = (time: number) =>
    48 +
    ((time - b.range.start.getTime()) /
      (b.range.end.getTime() - b.range.start.getTime())) *
      270;
  const y = (amount: number) => 196 - (amount / max) * 158;
  return (
    <BudgetPanel>
      <Text
        className="font-manrope-semibold text-lg"
        style={{ color: b.color }}
      >
        Budget progress
      </Text>
      <View
        accessible
        accessibilityLabel={`Cumulative ${trackedLabel(b.transactionType).toLowerCase()}: ${formatCurrency(b.tracked, b.currencyCode)}. Target ${formatCurrency(b.limit, b.currencyCode)}.`}
      >
        <Svg width="100%" height={240} viewBox="0 0 340 240">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <ViewlessGrid
              key={f}
              y={y(max * f)}
              label={new Intl.NumberFormat(undefined, {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(max * f)}
              color={c.muted}
              border={c.border}
            />
          ))}
          <Line
            x1={48}
            y1={y(b.limit)}
            x2={318}
            y2={y(b.limit)}
            stroke="#ef666d"
            strokeDasharray="6 4"
          />
          <SvgText
            x={316}
            y={y(b.limit) - 7}
            textAnchor="end"
            fill="#ef666d"
            fontSize={10}
          >
            Target
          </SvgText>
          <Line
            x1={48}
            y1={196}
            x2={318}
            y2={y(b.limit)}
            stroke={c.muted}
            strokeDasharray="6 4"
          />
          <Polyline
            points={b.points
              .map((p) => `${x(p.timestamp)},${y(p.amount)}`)
              .join(" ")}
            fill="none"
            stroke={b.color}
            strokeWidth={3}
          />
          {[0, 0.5, 1].map((f) => (
            <SvgText
              key={f}
              x={48 + 270 * f}
              y={222}
              fill={c.muted}
              fontSize={10}
              textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"}
            >
              {new Date(
                b.range.start.getTime() +
                  (b.range.end.getTime() - b.range.start.getTime() - 1) * f,
              ).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </SvgText>
          ))}
        </Svg>
      </View>
      <Text className="text-xs text-muted">
        <Text style={{ color: b.color }}>
          ━ {TYPE_LABELS[b.transactionType]}
        </Text>{" "}
        ┄ Ideal pace <Text style={{ color: "#ef666d" }}>┄ Target</Text>
      </Text>
    </BudgetPanel>
  );
}
function ViewlessGrid({
  y,
  label,
  color,
  border,
}: {
  y: number;
  label: string;
  color: string;
  border: string;
}) {
  return (
    <>
      <Line x1={48} x2={318} y1={y} y2={y} stroke={border} />
      <SvgText x={40} y={y + 4} textAnchor="end" fill={color} fontSize={10}>
        {label}
      </SvgText>
    </>
  );
}
