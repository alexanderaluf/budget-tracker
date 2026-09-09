import { SearchField } from "heroui-native";
import { useTranslation } from "react-i18next";

import { FilledIcon } from "@/shared/ui/filled-icon";

type TransactionSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TransactionSearchField({
  value,
  onChange,
}: TransactionSearchFieldProps) {
  const { t } = useTranslation();

  return (
    <SearchField value={value} onChange={onChange}>
      <SearchField.Group className="border border-border bg-surface">
        <SearchField.SearchIcon>
          <FilledIcon name="magnify" size={20} tone="muted" />
        </SearchField.SearchIcon>
        <SearchField.Input
          accessibilityLabel={t("search.field.accessibility")}
          autoCapitalize="none"
          autoCorrect={false}
          className="text-left"
          placeholder={t("search.field.placeholder")}
          returnKeyType="search"
        />
        <SearchField.ClearButton
          accessibilityLabel={t("search.field.clear")}
        >
          <FilledIcon name="close" size={18} tone="muted" />
        </SearchField.ClearButton>
      </SearchField.Group>
    </SearchField>
  );
}
