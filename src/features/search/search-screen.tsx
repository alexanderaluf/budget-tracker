import { useDeferredValue, useState } from "react";

import { useLocalData } from "@/data/local-data-provider";
import { selectSearchResults } from "@/data/selectors/document-selectors";
import { PageHeader } from "@/shared/ui/page-header";
import { TabPage } from "@/shared/ui/tab-page";

import { RecentSearches } from "./components/recent-searches";
import { SearchResults } from "./components/search-results";
import { TransactionSearchField } from "./components/transaction-search-field";
import { recentQueries } from "./data/search-data";
import { filterTransactions } from "./lib/filter-transactions";

export function SearchScreen() {
  const { document } = useLocalData();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const searchableTransactions = selectSearchResults(document);
  const results = filterTransactions(searchableTransactions, deferredQuery);

  return (
    <TabPage>
      <PageHeader
        description="Find any transaction across your connected accounts."
        eyebrow="Explore"
        title="Search"
      />
      <TransactionSearchField value={query} onChange={setQuery} />
      {!query ? (
        <RecentSearches queries={recentQueries} onSelect={setQuery} />
      ) : null}
      <SearchResults query={deferredQuery} results={results} />
    </TabPage>
  );
}
