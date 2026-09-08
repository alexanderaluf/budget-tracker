import { SearchField } from "heroui-native";

import { FilledIcon } from "@/shared/ui/filled-icon";

type TransactionSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TransactionSearchField({
  value,
  onChange,
}: TransactionSearchFieldProps) {
  return (
    <SearchField value={value} onChange={onChange}>
      <SearchField.Group className="border border-border bg-surface">
        <SearchField.SearchIcon>
          <FilledIcon name="magnify" size={20} tone="muted" />
        </SearchField.SearchIcon>
        <SearchField.Input
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Merchant, category, or account"
          returnKeyType="search"
        />
        <SearchField.ClearButton>
          <FilledIcon name="close" size={18} tone="muted" />
        </SearchField.ClearButton>
      </SearchField.Group>
    </SearchField>
  );
}
