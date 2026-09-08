import type { Account } from "../types";
import { BankAccountCard } from "./bank-account-card";
import { CreditAccountCard } from "./credit-account-card";

export function AccountCard({ account }: { account: Account }) {
  return account.kind === "credit" ? (
    <CreditAccountCard account={account} />
  ) : (
    <BankAccountCard account={account} />
  );
}
