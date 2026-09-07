// Run with: node --test tests/accounts.test.cjs
// Load the pure TypeScript data modules without adding a runtime test dependency.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const ts = require("typescript");
const sourceRoot = path.resolve(__dirname, "../src");
require.extensions[".ts"] = (module, filename) => {
  const compiled = ts
    .transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replace(
      /require\("@\/([^\"]+)"\)/g,
      (_, relative) =>
        `require(${JSON.stringify(path.join(sourceRoot, relative))})`,
    );
  module._compile(compiled, filename);
};
const { createDefaultBackup } = require("../src/data/model/default-backup.ts");
const {
  normalizeBackupDocument,
} = require("../src/data/model/normalize-backup.ts");
const {
  CARD_COMPANIES,
  addAccountToDocument,
  parseAccountAmount,
} = require("../src/data/model/account-record.ts");
const {
  selectAccounts,
  selectAccountTotalsByCurrency,
  selectMonthlySummary,
  selectSpendingCategories,
  selectDailySpending,
  selectBudgetCategories,
} = require("../src/data/selectors/document-selectors.ts");
const {
  createJsonBackupDocument,
  createFullBackupDocument,
} = require("../src/data/backup/document-export.ts");
const {
  ACCOUNT_ICON_GROUPS,
} = require("../src/features/accounts/account-options.ts");
const { migrateLocalDatabase } = require("../src/data/database/migrations.ts");
const {
  readDocument,
  writeDocument,
} = require("../src/data/database/document-repository.ts");
const now = "2026-09-07T12:00:00.000Z";
const draft = (overrides = {}) => ({
  name: " Travel card ",
  amount: "-123.45",
  accountNumber: "0012345",
  accountType: "card",
  currencyCode: "ILS",
  icon: "car",
  iconPath: null,
  color: "#AB47BC",
  isDefault: true,
  isExcluded: false,
  cardLastFour: "0007",
  cardCompany: "Visa",
  paymentDay: 31,
  ...overrides,
});
const add = (document, changes = {}, id = "test-account") =>
  addAccountToDocument(document, draft(changes), "alex-personal", id, now);

test("generated Material catalog contains every installed rounded symbol", () => {
  const metadata = JSON.parse(
    fs.readFileSync(
      path.resolve(
        __dirname,
        "../node_modules/@material-symbols-svg/react-native/dist/metadata/icon-index.json",
      ),
      "utf8",
    ),
  );
  const source = fs.readFileSync(
    path.join(
      sourceRoot,
      "features/accounts/data/material-rounded-filled-icons.ts",
    ),
    "utf8",
  );
  const assignment = source.indexOf("= [");
  const end = source.lastIndexOf("];");
  const icons = JSON.parse(source.slice(assignment + 2, end + 1));
  assert.equal(icons.length, 3903);
  assert.ok(icons.length <= Object.keys(metadata).length);
  assert.equal(new Set(icons.map((icon) => icon.name)).size, icons.length);
  assert.ok(
    icons.every(
      (icon) =>
        icon.name &&
        icon.searchText.includes(icon.name) &&
      /^[Mm]/.test(icon.pathData),
    ),
  );
  const trailingNames = icons.slice(-68).map((icon) => icon.name);
  assert.ok(trailingNames.every((name) => /^\d/.test(name) || name === "abc"));
  for (const name of ["10k", "18_up_rating", "360", "9mp", "abc"]) {
    assert.ok(trailingNames.includes(name));
  }
});

test("suggested icon categories contain 20 valid choices each", () => {
  const expectedTitles = [
    "Money & accounts",
    "Everyday spending",
    "Goals & interests",
    "Entertainment",
    "Food",
    "Groceries",
    "Subscriptions",
    "Transportation",
    "Travel",
    "Rent",
    "Health",
    "Education",
    "Utilities",
    "Other",
    "More",
  ];
  assert.deepEqual(
    ACCOUNT_ICON_GROUPS.map((group) => group.title),
    expectedTitles,
  );
  assert.ok(ACCOUNT_ICON_GROUPS.every((group) => group.icons.length >= 20));

  const source = fs.readFileSync(
    path.join(
      sourceRoot,
      "features/accounts/data/material-rounded-filled-icons.ts",
    ),
    "utf8",
  );
  const assignment = source.indexOf("= [");
  const end = source.lastIndexOf("];");
  const materialNames = new Set(
    JSON.parse(source.slice(assignment + 2, end + 1)).map(
      (icon) => `material:${icon.name}`,
    ),
  );
  assert.deepEqual(
    ACCOUNT_ICON_GROUPS.flatMap((group) =>
      group.icons
        .filter(
          (icon) =>
            icon.name.startsWith("material:") && !materialNames.has(icon.name),
        )
        .map((icon) => `${group.title}: ${icon.name}`),
    ),
    [],
  );
});

test("card saves explicit type, money, stable identity, leading zeroes, appearance and owner", () => {
  const current = createDefaultBackup();
  const next = add(current);
  const record = next.accounts.at(-1);
  assert.equal(record.uuid, "test-account");
  assert.equal(record.name, "Travel card");
  assert.equal(record.amount, -123.45);
  assert.equal(record.accountNumber, "0012345");
  assert.equal(record.cardLastFour, "0007");
  assert.equal(record.paymentDay, 31);
  assert.equal(record.user, "alex-personal");
  assert.equal(record.createdAt, now);
  assert.equal(record.updatedAt, now);
  const view = selectAccounts(next).at(-1);
  assert.equal(view.kind, "credit");
  assert.equal(view.icon, "car");
  assert.equal(view.iconPath, null);
  assert.equal(view.color, "#ab47bc");
  assert.equal(view.currencyCode, "ILS");
  assert.equal(view.lastFour, "0007");
  assert.equal(current.accounts.length, 3);
  assert.equal(current.accounts[0].isDefault, true);
});

test("default replacement is scoped to the owner, preserves other profiles and unknown data", () => {
  const current = createDefaultBackup();
  current.accounts.push({
    uuid: "other-owner",
    user: "alex-household",
    isDefault: true,
    custom: { keep: true },
  });
  current.customCollection = [{ value: "preserved" }];
  current.accounts[0].extra = { keep: true };
  const next = add(add(current), {}, "second-account");
  assert.deepEqual(
    next.accounts
      .filter((item) => item.user === "alex-personal" && item.isDefault)
      .map((item) => item.uuid),
    ["second-account"],
  );
  assert.equal(
    next.accounts.find((item) => item.uuid === "other-owner").isDefault,
    true,
  );
  assert.deepEqual(next.accounts[0].extra, { keep: true });
  assert.deepEqual(next.customCollection, current.customCollection);
  assert.equal(next._local.cloudProvider, null);
  assert.throws(() => add(next, {}, "second-account"), /already been saved/);
});

test("cash and savings discard hidden card-only draft fields and do not change defaults when off", () => {
  for (const accountType of ["cash", "savings"]) {
    const next = add(createDefaultBackup(), {
      accountType,
      isDefault: false,
      cardLastFour: "invalid",
      cardCompany: "",
      paymentDay: null,
    });
    const record = next.accounts.at(-1);
    assert.equal(record.cardLastFour, null);
    assert.equal(record.cardCompany, null);
    assert.equal(record.paymentDay, null);
    assert.equal(selectAccounts(next).at(-1).kind, accountType);
    assert.equal(next.accounts[0].isDefault, true);
  }
});

test("Material rounded filled icons persist their exact SVG path", () => {
  const pathData = "M120-120v-720h720v720H120Z";
  const next = add(createDefaultBackup(), {
    icon: "material:account-balance",
    iconPath: pathData,
  });
  const record = next.accounts.at(-1);
  const view = selectAccounts(next).at(-1);
  assert.equal(record.icon, "material:account-balance");
  assert.equal(record.iconPath, pathData);
  assert.equal(view.icon, "material:account-balance");
  assert.equal(view.iconPath, pathData);
});

test("reject malformed amounts, card details and missing owners before mutation", () => {
  for (const value of [
    "",
    " ",
    "NaN",
    "Infinity",
    "1e6",
    "1,234.56",
    "12.3456",
    "1.2.3",
    "9007199254740991",
  ])
    assert.throws(() => parseAccountAmount(value));
  assert.equal(parseAccountAmount("-12,50"), -12.5);
  assert.equal(parseAccountAmount("0"), 0);
  for (const changes of [
    { name: " " },
    { cardLastFour: "123" },
    { cardLastFour: "12a4" },
    { cardCompany: "" },
    { paymentDay: 0 },
    { paymentDay: 32 },
    { paymentDay: 1.5 },
    { color: "red" },
    { currencyCode: "?" },
    { icon: "material:account-balance", iconPath: null },
    { icon: "material:account-balance", iconPath: "invalid" },
  ])
    assert.throws(() => add(createDefaultBackup(), changes));
  assert.throws(
    () =>
      addAccountToDocument(
        createDefaultBackup(),
        draft(),
        "missing-owner",
        "new",
        now,
      ),
    /existing profile/,
  );
});

test("excluded accounts remain visible but never contribute to balances or spending calculations", () => {
  const current = createDefaultBackup();
  const next = add(current, {
    isExcluded: true,
    currencyCode: "USD",
    amount: "500",
    accountType: "cash",
  });
  next.transactions = [
    ...next.transactions,
    {
      uuid: "excluded-expense",
      account: "test-account",
      amount: 100,
      type: 0,
      category: "category-groceries",
      createdAt: now,
    },
  ];
  assert.equal(selectAccounts(next).length, 4);
  assert.deepEqual(
    selectAccountTotalsByCurrency(selectAccounts(next)),
    selectAccountTotalsByCurrency(selectAccounts(current)),
  );
  assert.deepEqual(selectMonthlySummary(next), selectMonthlySummary(current));
  assert.deepEqual(
    selectSpendingCategories(next),
    selectSpendingCategories(current),
  );
  assert.deepEqual(selectDailySpending(next), selectDailySpending(current));
  assert.deepEqual(
    selectBudgetCategories(next),
    selectBudgetCategories(current),
  );
});

test("mixed currencies have separate totals and new profiles only see their accounts", () => {
  const next = add(createDefaultBackup());
  const groups = selectAccountTotalsByCurrency(selectAccounts(next));
  assert.equal(groups.length, 2);
  assert.equal(
    groups.find((group) => group.currencyCode === "ILS").netWorth,
    -123.45,
  );
  next._local.selectedProfileId = "alex-household";
  assert.equal(selectAccounts(next).length, 0);
});

test("JSON backup round trip preserves all new account options and unknown fields", () => {
  const next = add(createDefaultBackup());
  next.unknown = { values: [1, 2, 3] };
  next.accounts.at(-1).unknown = "keep";
  const restored = normalizeBackupDocument(
    JSON.parse(JSON.stringify(createJsonBackupDocument(next))),
  );
  assert.deepEqual(restored.accounts, next.accounts);
  assert.deepEqual(restored.unknown, next.unknown);
  assert.equal(restored._local.schemaVersion, 4);
  assert.throws(() => normalizeBackupDocument({ backupVersion: 999 }), /newer/);
  assert.throws(
    () => normalizeBackupDocument({ _local: { schemaVersion: 999 } }),
    /newer/,
  );
});

function sqliteAdapter(filename) {
  const db = new DatabaseSync(filename);
  const adapter = {
    execAsync: async (sql) => db.exec(sql),
    getFirstAsync: async (sql, ...params) => db.prepare(sql).get(...params),
    runAsync: async (sql, ...params) => db.prepare(sql).run(...params),
    withExclusiveTransactionAsync: async (work) => {
      db.exec("BEGIN IMMEDIATE");
      try {
        await work(adapter);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    close: () => db.close(),
  };
  return adapter;
}

test("every card company survives SQLite reopening and both backup document formats", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "budget-card-companies-"));
  const filename = path.join(directory, "test.db");
  let database = sqliteAdapter(filename);
  try {
    await migrateLocalDatabase(database);
    let document = createDefaultBackup();
    for (const company of CARD_COMPANIES) {
      document = add(document, { cardCompany: company }, `company-${company}`);
    }
    await writeDocument(database, document);
    database.close();
    database = sqliteAdapter(filename);
    const saved = await readDocument(database);
    for (const exportDocument of [createJsonBackupDocument, createFullBackupDocument]) {
      const restored = normalizeBackupDocument(
        JSON.parse(JSON.stringify(exportDocument(saved))),
      );
      for (const company of CARD_COMPANIES) {
        const id = `company-${company}`;
        assert.equal(restored.accounts.find((record) => record.uuid === id).cardCompany, company);
        assert.equal(selectAccounts(restored).find((account) => account.id === id).cardCompany, company);
      }
    }
  } finally {
    database.close();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith("budget-card-companies-"));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("SQLite v2 to v4 migration preserves imported fields, commits accounts, survives reopening and rolls back failed writes", async () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "budget-accounts-test-"),
  );
  const filename = path.join(directory, "test.db");
  let database = sqliteAdapter(filename);
  try {
    await database.execAsync(
      "CREATE TABLE app_document (id INTEGER PRIMARY KEY, schema_version INTEGER NOT NULL, document_json TEXT NOT NULL, updated_at TEXT NOT NULL); PRAGMA user_version = 2;",
    );
    const legacy = createDefaultBackup();
    legacy._local.schemaVersion = 2;
    legacy.importedUnknown = { keep: true };
    delete legacy.accounts[0].accountType;
    legacy.accounts[0].icon = 12345;
    legacy.accounts[0].custom = "legacy";
    await database.runAsync(
      "INSERT INTO app_document VALUES (1, 2, ?, ?)",
      JSON.stringify(legacy),
      now,
    );
    await migrateLocalDatabase(database);
    const migrated = await readDocument(database);
    assert.equal(migrated._local.schemaVersion, 4);
    assert.equal(migrated.accounts[0].accountType, null);
    assert.equal(migrated.accounts[0].icon, 12345);
    assert.equal(migrated.accounts[0].custom, "legacy");
    assert.equal(migrated.accounts[0].iconPath, null);
    assert.deepEqual(migrated.importedUnknown, { keep: true });
    assert.equal(
      (await database.getFirstAsync("PRAGMA user_version")).user_version,
      4,
    );
    const next = add(migrated);
    await writeDocument(database, next);
    database.close();
    database = sqliteAdapter(filename);
    assert.deepEqual(await readDocument(database), next);
    await migrateLocalDatabase(database);
    assert.deepEqual(await readDocument(database), next);
    await database.execAsync(
      "CREATE TRIGGER fail_write BEFORE INSERT ON app_document BEGIN SELECT RAISE(ABORT, 'test write failure'); END;",
    );
    await assert.rejects(
      writeDocument(database, add(next, {}, "failed-account")),
      /test write failure/,
    );
    assert.deepEqual(await readDocument(database), next);
  } finally {
    database.close();
    assert.equal(
      path.dirname(path.resolve(directory)),
      path.resolve(os.tmpdir()),
    );
    assert.ok(path.basename(directory).startsWith("budget-accounts-test-"));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
