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
          <FilledIcon color="#a3a3a3" name="magnify" size={20} />
        </SearchField.SearchIcon>
        <SearchField.Input
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Merchant, category, or account"
          returnKeyType="search"
        />
        <SearchField.ClearButton>
          <FilledIcon color="#a3a3a3" name="close" size={18} />
        </SearchField.ClearButton>
      </SearchField.Group>
    </SearchField>
  );
}
