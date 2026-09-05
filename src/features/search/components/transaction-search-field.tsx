import { SearchField } from "heroui-native";

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
        <SearchField.SearchIcon iconProps={{ color: "#a3a3a3", size: 18 }} />
        <SearchField.Input
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Merchant, category, or account"
          returnKeyType="search"
        />
        <SearchField.ClearButton iconProps={{ color: "#a3a3a3", size: 15 }} />
      </SearchField.Group>
    </SearchField>
  );
}
