import { useRef, useState } from "react";
import { uuid } from "expo-modules-core";
import { Button } from "heroui-native";
import { Text } from "react-native";
import { useLocalData } from "@/data/local-data-provider";
import { addBudgetTransaction } from "@/data/model/budget-record";
import type { Budget } from "@/data/selectors/budget-selectors";
import {
  selectAccounts,
  selectCategories,
} from "@/data/selectors/document-selectors";
import {
  BudgetField,
  BudgetOption,
  BudgetSheet,
  TYPE_LABELS,
} from "./budget-ui";

export function BudgetTransactionSheet({
  budget,
  onClose,
}: {
  budget: Budget;
  onClose: () => void;
}) {
  const { document, updateDocument } = useLocalData();
  const accounts = selectAccounts(document).filter(
    (a) => a.currencyCode === budget.currencyCode,
  );
  const sourceAccounts = accounts.filter(
    (a) => !budget.accounts.length || budget.accounts.includes(a.id),
  );
  const categories = selectCategories(document).filter(
    (c) =>
      c.type === budget.transactionType &&
      (budget.budgetType === "Overall" ||
        budget.breakdown.some((b) => b.id === c.id)),
  );
  const [draft, setDraft] = useState(() => {
    const now = new Date();
    return {
      name: "",
      amount: "",
      accountId: sourceAccounts[0]?.id ?? "",
      categoryId: categories[0]?.id ?? "",
      toAccountId: "",
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    };
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const saving = useRef(false),
    id = useRef(uuid.v4());
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await updateDocument((current) =>
        addBudgetTransaction(
          current,
          budget.id,
          draft,
          id.current,
          new Date().toISOString(),
        ),
      );
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to save transaction.",
      );
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <BudgetSheet
      title={`Add ${TYPE_LABELS[budget.transactionType].toLowerCase()}`}
      onClose={onClose}
      busy={busy}
    >
      <BudgetField
        editable={!busy}
        accessibilityLabel="Transaction name"
        placeholder="Transaction name"
        value={draft.name}
        onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
        maxLength={100}
      />
      <BudgetField
        editable={!busy}
        accessibilityLabel="Transaction amount"
        placeholder={`Amount · ${budget.currencyCode}`}
        keyboardType="decimal-pad"
        value={draft.amount}
        onChangeText={(amount) => setDraft((d) => ({ ...d, amount }))}
      />
      <BudgetField
        editable={!busy}
        accessibilityLabel="Transaction date"
        placeholder="YYYY-MM-DD"
        value={draft.date}
        onChangeText={(date) => setDraft((d) => ({ ...d, date }))}
      />
      <Text className="mt-3 font-manrope-semibold text-lg text-foreground">
        Category
      </Text>
      {categories.map((c) => (
        <BudgetOption
          key={c.id}
          title={c.name}
          selected={draft.categoryId === c.id}
          onPress={() => !busy && setDraft((d) => ({ ...d, categoryId: c.id }))}
        />
      ))}
      {!categories.length && (
        <Text className="text-muted">
          Add a matching category in Profile → Categories first.
        </Text>
      )}
      <Text className="mt-3 font-manrope-semibold text-lg text-foreground">
        {budget.transactionType === 2 ? "From account" : "Account"}
      </Text>
      {sourceAccounts.map((a) => (
        <BudgetOption
          key={a.id}
          title={a.name}
          selected={draft.accountId === a.id}
          onPress={() => !busy && setDraft((d) => ({ ...d, accountId: a.id }))}
        />
      ))}
      {!sourceAccounts.length && (
        <Text className="text-muted">
          Create an account in {budget.currencyCode} or update this budget’s
          account filter first.
        </Text>
      )}
      {budget.transactionType === 2 && (
        <>
          <Text className="mt-3 font-manrope-semibold text-lg text-foreground">
            To account
          </Text>
          {accounts
            .filter((a) => a.id !== draft.accountId)
            .map((a) => (
              <BudgetOption
                key={a.id}
                title={a.name}
                selected={draft.toAccountId === a.id}
                onPress={() =>
                  !busy && setDraft((d) => ({ ...d, toAccountId: a.id }))
                }
              />
            ))}
          <Text className="text-sm text-muted">
            Transfers move money between two accounts in the same currency and
            count once, under the source account.
          </Text>
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" className="text-danger">
          {error}
        </Text>
      )}
      <Button
        isDisabled={busy || !sourceAccounts.length || !categories.length}
        onPress={save}
      >
        {busy ? "Saving…" : "Save transaction"}
      </Button>
    </BudgetSheet>
  );
}
