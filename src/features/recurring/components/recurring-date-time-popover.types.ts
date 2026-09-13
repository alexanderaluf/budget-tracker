export type RecurringDateTimePopoverProps = {
  accentColor: string;
  isDark: boolean;
  isPresented: boolean;
  mode: "date" | "time";
  title: string;
  value: Date;
  onDismiss: () => void;
  onValueChange: (value: Date) => void;
};
