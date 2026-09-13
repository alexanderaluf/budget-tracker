import {
  DatePicker,
  Host,
  Popover,
  Spacer,
  VStack,
} from "@expo/ui/swift-ui";
import {
  datePickerStyle,
  frame,
  padding,
  tint,
} from "@expo/ui/swift-ui/modifiers";

import type { RecurringDateTimePopoverProps } from "./recurring-date-time-popover.types";

export function RecurringDateTimePopover({
  accentColor,
  isDark,
  isPresented,
  mode,
  title,
  value,
  onDismiss,
  onValueChange,
}: RecurringDateTimePopoverProps) {
  return (
    <Host
      colorScheme={isDark ? "dark" : "light"}
      seedColor={accentColor}
      style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        width: 1,
        height: 1,
      }}
    >
      <Popover
        isPresented={isPresented}
        attachmentAnchor="bottom"
        onIsPresentedChange={(presented) => {
          if (!presented) onDismiss();
        }}
      >
        <Popover.Trigger>
          <Spacer modifiers={[frame({ width: 1, height: 1 })]} />
        </Popover.Trigger>
        <Popover.Content>
          <VStack
            spacing={12}
            modifiers={[
              frame({ width: mode === "date" ? 340 : 300 }),
              padding({ all: 12 }),
            ]}
          >
            <DatePicker
              title={title}
              selection={value}
              displayedComponents={[
                mode === "time" ? "hourAndMinute" : "date",
              ]}
              modifiers={[
                datePickerStyle(mode === "time" ? "wheel" : "graphical"),
                tint(accentColor),
              ]}
              onDateChange={onValueChange}
            />
          </VStack>
        </Popover.Content>
      </Popover>
    </Host>
  );
}
