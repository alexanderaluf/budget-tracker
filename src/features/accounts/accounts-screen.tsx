import { Chip } from "heroui-native";
import { Alert } from "react-native";

import { useLocalData } from "@/data/local-data-provider";
import {
    selectAccounts,
    selectAccountTotals,
} from "@/data/selectors/document-selectors";
import { PageHeader } from "@/shared/ui/page-header";
import { TabPage } from "@/shared/ui/tab-page";

import { AccountList } from "./components/account-list";
import { AccountsSummaryCard } from "./components/accounts-summary-card";
import type { Account } from "./types";

export function AccountsScreen() {
  const { document } = useLocalData();
  const accounts = selectAccounts(document);
  const accountTotals = selectAccountTotals(accounts);

  function handleAccountPress(account: Account) {
    Alert.alert(account.name, `Account ending in ${account.lastFour}`);
  }

  return (
    <TabPage>
      <PageHeader
        action={
          <Chip color="success" size="sm" variant="soft">
            <Chip.Label className="font-manrope-bold">
              {accounts.length} linked
            </Chip.Label>
          </Chip>
        }
        description="All balances, cards, and savings in one place."
        eyebrow="Portfolio"
        title="Accounts"
      />

      <AccountsSummaryCard {...accountTotals} />
      <AccountList accounts={accounts} onAccountPress={handleAccountPress} />
    </TabPage>
  );
}
