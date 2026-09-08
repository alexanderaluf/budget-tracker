import { Switch as HeroSwitch, Input } from "heroui-native";
import { useState } from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    CONTRIBUTION_MODE_OPTIONS,
    estimateSavingsDraftWithdrawal,
    LIQUIDITY_OPTIONS,
    SAVINGS_PRODUCT_OPTIONS,
    TAX_BASIS_OPTIONS,
    TAX_TREATMENT_OPTIONS,
    type SavingsDetailsDraft,
} from "@/data/model/savings-account";
import { formatCurrency } from "@/shared/lib/currency";
import { FilledIcon } from "@/shared/ui/filled-icon";

type SavingsDetailsFormProps = {
  balance: number;
  currencyCode: string;
  value: SavingsDetailsDraft;
  onChange: (value: SavingsDetailsDraft) => void;
};

export function SavingsDetailsForm({
  balance,
  currencyCode,
  value,
  onChange,
}: SavingsDetailsFormProps) {
  const [showProducts, setShowProducts] = useState(false);
  const product = SAVINGS_PRODUCT_OPTIONS.find(
    (option) => option.value === value.productType,
  )!;
  const estimate = estimateSavingsDraftWithdrawal(balance, value);

  function change<K extends keyof SavingsDetailsDraft>(
    key: K,
    next: SavingsDetailsDraft[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  if (!value.isDetailed) {
    return (
      <View className="pt-1">
        <SavingsModeToggle
          isDetailed={false}
          onChange={(isDetailed) => change("isDetailed", isDetailed)}
        />
      </View>
    );
  }

  return (
    <View className="gap-5 pt-1">
      <SavingsModeToggle
        isDetailed
        onChange={(isDetailed) => change("isDetailed", isDetailed)}
      />

      <View className="gap-2">
        <FieldLabel>Product type</FieldLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showProducts }}
          onPress={() => setShowProducts((current) => !current)}
          className="min-h-16 flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3"
        >
          <View className="flex-1 gap-1">
            <Text className="font-manrope-semibold text-sm text-foreground">
              {product.label}
            </Text>
            <Text className="font-sans text-xs leading-4 text-muted">
              {product.description}
            </Text>
          </View>
          <FilledIcon
            color="#ededed"
            name={showProducts ? "close" : "chevron-right"}
            size={20}
          />
        </Pressable>
        {showProducts && (
          <View className="overflow-hidden rounded-2xl border border-border bg-surface">
            {SAVINGS_PRODUCT_OPTIONS.map((option, index) => {
              const selected = option.value === value.productType;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    change("productType", option.value);
                    setShowProducts(false);
                  }}
                  className={`min-h-16 flex-row items-center gap-3 px-4 py-3 ${index < SAVINGS_PRODUCT_OPTIONS.length - 1 ? "border-b border-border" : ""}`}
                >
                  <View className="flex-1 gap-1">
                    <Text className="font-manrope-semibold text-sm text-foreground">
                      {option.label}
                    </Text>
                    <Text className="font-sans text-xs leading-4 text-muted">
                      {option.description}
                    </Text>
                  </View>
                  {selected && (
                    <FilledIcon color="#70d2eb" name="check" size={20} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <TextField
        label="Provider or institution"
        placeholder="e.g. Bank Leumi, pension fund, broker"
        value={value.providerName}
        onChange={(next) => change("providerName", next)}
      />

      <Section title="Ownership and contributions">
        <MoneyField
          currencyCode={currencyCode}
          label="Your contributed principal"
          value={value.contributedPrincipal}
          onChange={(next) => change("contributedPrincipal", next)}
        />
        <ChoiceGroup
          label="Contribution method"
          options={CONTRIBUTION_MODE_OPTIONS}
          value={value.contributionMode}
          onChange={(next) => change("contributionMode", next)}
        />
        {value.contributionMode !== "lump_sum" && (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <MoneyField
                currencyCode={currencyCode}
                label="Your monthly deposit"
                value={value.monthlyContribution}
                onChange={(next) => change("monthlyContribution", next)}
              />
            </View>
            {(value.contributionMode === "employer" ||
              value.contributionMode === "mixed") && (
              <View className="flex-1">
                <MoneyField
                  currencyCode={currencyCode}
                  label="Employer monthly"
                  value={value.employerMonthlyContribution}
                  onChange={(next) =>
                    change("employerMonthlyContribution", next)
                  }
                />
              </View>
            )}
          </View>
        )}
        <RateField
          label="Expected annual return"
          value={value.expectedAnnualReturnRate}
          onChange={(next) => change("expectedAnnualReturnRate", next)}
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Start date"
              placeholder="YYYY-MM-DD"
              value={value.startDate}
              onChange={(next) => change("startDate", next)}
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Maturity date"
              placeholder="YYYY-MM-DD"
              value={value.maturityDate}
              onChange={(next) => change("maturityDate", next)}
            />
          </View>
        </View>
      </Section>

      <Section title="Withdrawal access">
        <ChoiceGroup
          label="When can you access the money?"
          options={LIQUIDITY_OPTIONS}
          value={value.liquidity}
          onChange={(next) => change("liquidity", next)}
        />
        {value.liquidity === "notice" && (
          <NumberField
            label="Notice period (days)"
            placeholder="30"
            value={value.withdrawalNoticeDays}
            onChange={(next) => change("withdrawalNoticeDays", next)}
          />
        )}
      </Section>

      <Section title="Provider fees">
        <Text className="font-sans text-xs leading-5 text-muted">
          Enter the rates shown in your plan documents. Leave a fee at 0 when it
          does not apply.
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <RateField
              label="Annual management"
              value={value.annualManagementFeeRate}
              onChange={(next) => change("annualManagementFeeRate", next)}
            />
          </View>
          <View className="flex-1">
            <RateField
              label="Deposit fee"
              value={value.contributionFeeRate}
              onChange={(next) => change("contributionFeeRate", next)}
            />
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <RateField
              label="Performance fee"
              value={value.performanceFeeRate}
              onChange={(next) => change("performanceFeeRate", next)}
            />
          </View>
          <View className="flex-1">
            <RateField
              label="Early withdrawal"
              value={value.earlyWithdrawalFeeRate}
              onChange={(next) => change("earlyWithdrawalFeeRate", next)}
            />
          </View>
        </View>
      </Section>

      <Section title="Withdrawal tax estimate">
        <Text className="font-sans text-xs leading-5 text-muted">
          Tax rules change by residency, product and date. Use rates from your
          current official guidance or adviser; this estimate is not tax advice.
        </Text>
        <TextField
          label="Tax jurisdiction"
          placeholder="e.g. Israel, United Kingdom, Ontario"
          value={value.taxJurisdiction}
          onChange={(next) => change("taxJurisdiction", next)}
        />
        <ChoiceGroup
          label="Tax treatment"
          options={TAX_TREATMENT_OPTIONS}
          value={value.taxTreatment}
          onChange={(next) => change("taxTreatment", next)}
        />
        {value.taxTreatment !== "tax_exempt" && (
          <>
            <ChoiceGroup
              label="Taxable amount"
              options={TAX_BASIS_OPTIONS}
              value={value.taxBasis}
              onChange={(next) => change("taxBasis", next)}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <RateField
                  label={
                    value.taxTreatment === "progressive"
                      ? "Estimated effective tax"
                      : "Estimated tax rate"
                  }
                  value={value.estimatedTaxRate}
                  onChange={(next) => change("estimatedTaxRate", next)}
                />
              </View>
              <View className="flex-1">
                <MoneyField
                  currencyCode={currencyCode}
                  label="Tax-free allowance"
                  value={value.taxFreeAllowance}
                  onChange={(next) => change("taxFreeAllowance", next)}
                />
              </View>
            </View>
          </>
        )}
      </Section>

      <View className="gap-3 rounded-2xl border border-border bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-manrope-bold text-base text-foreground">
            Full withdrawal estimate
          </Text>
          <Text className="font-manrope-bold text-base text-accent">
            {formatCurrency(estimate.estimatedNetWithdrawal, currencyCode)}
          </Text>
        </View>
        <EstimateRow
          label="Current balance"
          value={estimate.balance}
          currencyCode={currencyCode}
        />
        <EstimateRow
          label="Your principal"
          value={estimate.principal}
          currencyCode={currencyCode}
        />
        <EstimateRow
          label="Investment earnings"
          value={estimate.earnings}
          currencyCode={currencyCode}
        />
        <EstimateRow
          label="Performance fee"
          value={-estimate.performanceFee}
          currencyCode={currencyCode}
        />
        <EstimateRow
          label="Early withdrawal fee"
          value={-estimate.earlyWithdrawalFee}
          currencyCode={currencyCode}
        />
        <EstimateRow
          label="Estimated tax"
          value={-estimate.estimatedTax}
          currencyCode={currencyCode}
        />
        <Text className="font-sans text-[11px] leading-4 text-muted">
          Annual management cost at the entered rate:{" "}
          {formatCurrency(estimate.estimatedAnnualManagementFee, currencyCode)}.
          Actual provider and tax calculations may differ.
        </Text>
      </View>

      <View className="gap-2">
        <FieldLabel>Notes (optional)</FieldLabel>
        <TextInput
          accessibilityLabel="Savings notes"
          multiline
          maxLength={500}
          onChangeText={(next) => change("notes", next)}
          placeholder="Access conditions, guarantees, beneficiary notes..."
          placeholderTextColor="#777777"
          style={styles.notes}
          textAlignVertical="top"
          value={value.notes}
        />
      </View>
    </View>
  );
}

function SavingsModeToggle({
  isDetailed,
  onChange,
}: {
  isDetailed: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Detailed savings tracking"
      accessibilityHint="Adds product, contribution, access, fee and tax fields."
      accessibilityState={{ checked: isDetailed }}
      className="flex-row items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-4"
      onPress={() => onChange(!isDetailed)}
    >
      <View className="size-11 items-center justify-center rounded-xl bg-accent/15">
        <FilledIcon color="#70d2eb" name="piggy-bank" size={23} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-manrope-semibold text-base text-foreground">
          Detailed savings tracking
        </Text>
        <Text className="font-sans text-xs leading-5 text-muted">
          {isDetailed
            ? "Product terms, contributions, fees and tax estimates are enabled."
            : "Keep it simple with only the name, balance and account number above."}
        </Text>
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
      >
        {Platform.OS === "android" ? (
          <HeroSwitch isSelected={isDetailed} style={{ height: 28, width: 60 }}>
            <HeroSwitch.Thumb style={{ height: 24, width: 36 }} />
          </HeroSwitch>
        ) : (
          <Switch
            thumbColor={isDetailed ? "#073442" : "#bdbdbd"}
            trackColor={{ false: "#333333", true: "#70d2eb" }}
            value={isDetailed}
          />
        )}
      </View>
    </Pressable>
  );
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View className="gap-4 border-t border-border pt-4">
      <Text className="font-manrope-bold text-sm text-foreground">{title}</Text>
      {children}
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="font-manrope-medium text-sm text-muted">{children}</Text>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View className="gap-2">
      <FieldLabel>{label}</FieldLabel>
      <Input
        accessibilityLabel={label}
        className="h-14 rounded-2xl bg-surface"
        onChangeText={onChange}
        placeholder={placeholder}
        value={value}
      />
    </View>
  );
}

function NumberField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View className="gap-2">
      <FieldLabel>{label}</FieldLabel>
      <Input
        accessibilityLabel={label}
        className="h-14 rounded-2xl bg-surface"
        keyboardType="decimal-pad"
        onChangeText={onChange}
        placeholder={placeholder}
        value={value}
      />
    </View>
  );
}

function MoneyField({
  currencyCode,
  label,
  onChange,
  value,
}: {
  currencyCode: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <NumberField
      label={`${label} (${currencyCode})`}
      onChange={onChange}
      placeholder="0.00"
      value={value}
    />
  );
}

function RateField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <NumberField
      label={`${label} (%)`}
      onChange={onChange}
      placeholder="0"
      value={value}
    />
  );
}

function ChoiceGroup<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  value: T;
}) {
  return (
    <View className="gap-2">
      <FieldLabel>{label}</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              className={`min-h-10 justify-center rounded-xl border px-3 py-2 ${selected ? "border-accent bg-accent/15" : "border-border bg-surface"}`}
              onPress={() => onChange(option.value)}
            >
              <Text
                className={`font-manrope-semibold text-xs ${selected ? "text-accent" : "text-foreground"}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EstimateRow({
  currencyCode,
  label,
  value,
}: {
  currencyCode: string;
  label: string;
  value: number;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="font-sans text-xs text-muted">{label}</Text>
      <Text
        className={`font-manrope-semibold text-xs ${value < 0 ? "text-danger" : "text-foreground"}`}
      >
        {value < 0 ? "−" : ""}
        {formatCurrency(value, currencyCode)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notes: {
    backgroundColor: "#171717",
    borderRadius: 16,
    color: "#ededed",
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    minHeight: 104,
    padding: 14,
  },
});
