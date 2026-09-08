import type { Account } from "../types";
import { BankAccountCard } from "./bank-account-card";
import { CreditAccountCard } from "./credit-account-card";
import { SavingsAccountCard } from "./savings-account-card";

export function AccountCard({ account }: { account: Account }) {
  if (account.kind === "credit") return <CreditAccountCard account={account} />;
  if (account.kind === "savings")
    return <SavingsAccountCard account={account} />;
  return <BankAccountCard account={account} />;
}
