# Contracts Package

Shared domain model and type system for Budgie. Contains Drizzle ORM tables, Effect Schemas, repository classes, and TypeScript types used by `app`, `ai`, and `sync` packages.

## Commands

```bash
pnpm build                    # Build package (required after changes)
pnpm ts                       # Native TypeScript 7 check
pnpm lint                     # Oxlint + 13-rule ESLint fallback
```

## Structure

```
src/
├── @generic/                 # Shared infrastructure
│   ├── constant/             # PRECISION, base fields
│   ├── enum/                 # Language, Theme, Currency, UserIconName
│   ├── interface/            # DateRange, etc.
│   ├── repository/           # BaseTransactionFilterRepository
│   ├── type/                 # DB, TX types
│   └── util/                 # Table columns, schema utils, SQL helpers
├── [entity]/                 # Entity modules (15 total)
│   ├── constant/             # Validation limits
│   ├── entity/               # Inferred entity types
│   ├── enum/                 # Entity enums
│   ├── input/                # Form input interfaces
│   ├── interface/            # Filter interfaces
│   ├── relations/            # Drizzle relations
│   ├── repository/           # Repository service (Context.Service + layer)
│   ├── schema/               # Effect Schemas (runtime-validated inputs only)
│   └── table/                # Drizzle table definition
├── schema.ts                 # Aggregated schema exports
└── index.ts                  # Public API exports
```

## Entity Folder Rules

**CRITICAL: Flat structure only** - Each entity has these folders at the same level. Never nest deeper:

```
account/
├── constant/
├── entity/
├── enum/
├── input/
├── interface/
├── relations/
├── repository/
├── schema/
└── table/
```

## Entities

| Entity            | Table                       | Purpose                                       |
| ----------------- | --------------------------- | --------------------------------------------- |
| Account           | `accounts`                  | Financial accounts (bank, cash, crypto, etc.) |
| AccountBalance    | `account_balances`          | Cached balance snapshots                      |
| Transaction       | `transactions`              | Financial transactions                        |
| TransactionEntry  | `transaction_entries`       | Double-entry bookkeeping lines                |
| TransactionTags   | `transaction_tags`          | Many-to-many transaction-tag links            |
| Category          | `categories`                | Transaction categorization                    |
| Tag               | `tags`                      | User-defined labels                           |
| Instrument        | `instruments`               | Currencies and assets                         |
| ExchangeRate      | `exchange_rates`            | Currency conversion rates                     |
| Settings          | `settings`                  | User preferences                              |
| BankSync          | `bank_syncs`                | Bank integration configuration                |
| MccGroup          | `mcc_groups`                | Merchant category groups                      |
| MccCategory       | `mcc_categories`            | Merchant category codes                       |
| MerchantEmbedding | `title_embeddings_merchant` | Vector embeddings for merchant titles         |
| CommentEmbedding  | `title_embeddings_comment`  | Vector embeddings for transaction comments    |

## Drizzle Table Definitions

### Base Entity Columns

All tables use `withBaseEntityTableColumns()` for standard columns:

```typescript
import { withBaseEntityTableColumns } from '../@generic/util/with-base-entity-table-columns.util';

export const AccountEntityTable = sqliteTable('accounts', {
    ...withBaseEntityTableColumns(), // id, createdAt, updatedAt, deletedAt
    title: text('title').notNull()
    // ... other columns
});
```

**Standard columns:**

- `id` - Auto-incrementing primary key
- `createdAt` - Timestamp (default: current)
- `updatedAt` - Timestamp (default: current)
- `deletedAt` - Soft delete marker (nullable)

### Table Naming

- Table name: `snake_case` plural (e.g., `accounts`, `transaction_entries`)
- Column name: `camelCase` in code, `snake_case` in SQL
- File name: `[entity]-entity.table.ts`

### Example Table

```typescript
export const TransactionEntityTable = sqliteTable('transactions', {
    ...withBaseEntityTableColumns(),
    type: text('type').$type<TransactionTypeEnum>().notNull(),
    title: text('title').notNull().default(''),
    operatedAt: integer('operated_at', { mode: 'timestamp' }).notNull(),
    fromAccountId: integer('from_account_id').references(() => AccountEntityTable.id),
    toAccountId: integer('to_account_id').references(() => AccountEntityTable.id)
});
```

## Drizzle Relations

Define relations in separate files:

```typescript
// transaction/relations/transaction-entity.relations.ts
export const TransactionEntityRelations = relations(TransactionEntityTable, ({ one, many }) => ({
    entries: many(TransactionEntryEntityTable),
    fromAccount: one(AccountEntityTable, {
        fields: [TransactionEntityTable.fromAccountId],
        references: [AccountEntityTable.id],
        relationName: 'fromAccount'
    }),
    transactionTags: many(TransactionTagsEntityTable)
}));
```

## Repository Pattern

### Class Structure

Repositories are `Context.Service` classes with a `static readonly layer`. Every method is an Effect over `Db.query`, so it joins the active `Db.transaction` automatically. No method takes a `tx` or `db` parameter and there is no constructor.

```typescript
export class AccountRepository extends Context.Service<AccountRepository>()('@budgie/contracts/AccountRepository', {
    make: Effect.sync(() => {
        const bulkCreate = (inputs: AccountCreateEntityInterface[]) =>
            Db.query(db => db.insert(AccountEntityTable).values(inputs).returning());

        return {
            create: Effect.fn('AccountRepository.create')(function* (input: AccountCreateEntityInterface) {
                const [account] = yield* bulkCreate([input]);

                return account;
            }),
            bulkCreate,
            findById: (id: number) => Db.query(db => db.query.AccountEntityTable.findFirst({ where: eq(AccountEntityTable.id, id) }))
        };
    })
}) {
    static readonly layer = Layer.effect(AccountRepository, AccountRepository.make);
}
```

- A single-query method is a plain arrow over `Db.query`; a multi-step method is `Effect.fn('Repo.method')`.
- Private helpers are `make` locals, never `this`. Dependencies on other services are resolved once in `make` with `yield*` and provided in `layer` via `Layer.provide`.
- Never capture `Db` in `make`; `Db.transaction` swaps it per transaction.

### Transaction Support

Atomic work is `Db.transaction(Effect.gen(function* () { ... }))`. Repository methods never open or accept transactions. `Db.transaction` reuses the active transaction when nested, so expo-sqlite's lack of nested transactions is handled in one place.

```typescript
yield *
    Db.transaction(
        Effect.gen(function* () {
            yield* accountRepository.archiveById(id);
            yield* debtEventRepository.archiveByAccountIds([id]);
        })
    );
```

### Query API Preference

### Reads Are Effects

Reads that feed React are `Db.query(db => ...)` Effects run by `databaseQueryAtom([Tables], Effect.flatMap(Repo, repo => repo.method(...)))` in the app; list every table the SQL reads. Repositories never return Drizzle builders.

**Prefer:**

```typescript
Db.query(db =>
    db.query.AccountEntityTable.findMany({
        where: eq(AccountEntityTable.isActive, true),
        with: { instrument: true }
    })
);
```

**Use `db.select()` only for complex queries:**

```typescript
Db.query(db =>
    db
        .select({ total: sql<number>`SUM(amount)` })
        .from(TransactionEntryEntityTable)
        .innerJoin(...)
        .where(...)
);
```

### Base Repository

`BaseTransactionFilterRepository` is a plain predicate-builder class. Instantiate it inside `make` and reuse its `build*Condition` methods:

```typescript
make: Effect.sync(() => {
    const filters = new BaseTransactionFilterRepository();

    return {
        getAll: (limit: number, transactionFilters?: TransactionFilterInterface) =>
            Db.query(db =>
                db.query.TransactionEntityTable.findMany({
                    where: filters.buildFilterWhere(transactionFilters),
                    limit,
                    with: { entries: true, transactionTags: true }
                })
            )
    };
});
```

## Effect Schemas

Entity, create and update types are plain Drizzle types; there is no schema layer for them. Only inputs validated at runtime (forms, IBAN check) get an Effect Schema in `schema/`.

### Entity / Create / Update Interfaces

```typescript
// entity/account-entity.interface.ts
export type AccountEntityInterface = typeof AccountEntityTable.$inferSelect;

// entity/account-create-entity.interface.ts
export type AccountCreateEntityInterface = PartialByKeysType<
    Omit<AccountEntityInterface, BaseEntityKeyType | 'titleSearch'>,
    'iban' | 'debtType'
>;

// entity/account-update-entity.interface.ts
export type AccountUpdateEntityInterface = Partial<AccountCreateEntityInterface>;
```

Narrow enum columns with `.$type<XEnum>()` on the table column (type-only, no migration).

### Runtime Input Schemas

```typescript
import * as Schema from 'effect/Schema';

export const TagCreateEntitySchema = Schema.Struct({
    title: Schema.Trim.check(Schema.isMinLength(TAG_TITLE_MIN_LENGTH), Schema.isMaxLength(TAG_TITLE_MAX_LENGTH))
});
```

- Reuse `PositiveNumberSchema` / `NonNegativeNumberSchema` from `@generic/schema`.
- Cross-field rules use `.check(Schema.makeFilter(value => ok || { path, issue }))`.
- Validate synchronously with `Schema.is(X)(value)` or `Schema.decodeUnknownSync(X)(value)`.

### Input Interfaces

Infer from schemas; `Mutable` keeps the type usable as React Hook Form values:

```typescript
// input/account-create-input.interface.ts
export type AccountCreateInputInterface = Mutable<typeof AccountCreateInputSchema.Type>;
```

## Type System

### DB and TX Types

```typescript
// @generic/type/db.type.ts
export type DB = ExpoSQLiteDatabase<typeof schema>;
export type TX = Parameters<Parameters<DB['transaction']>[0]>[0];
```

### Entity Types

Infer from Drizzle schemas:

```typescript
// entity/account.entity.ts
export type AccountEntity = typeof AccountEntityTable.$inferSelect;
```

### Filter Interfaces

```typescript
export interface TransactionFilterInterface {
    types: TransactionTypeEnum[] | null;
    date: DateRangeInterface | null;
    categoryIds: number[] | null;
    accountIds: number[] | null;
    tagIds: number[] | null;
}
```

## Constants

### PRECISION

Monetary values use integer-based precision:

```typescript
export const PRECISION = 1_000_000;

// Usage: Store $10.50 as 10_500_000
const amount = 10.5 * PRECISION;
```

### Validation Limits

Each entity has validation constants:

```typescript
// account/constant/
export const ACCOUNT_TITLE_MIN_LENGTH = 1;
export const ACCOUNT_TITLE_MAX_LENGTH = 50;
```

## Enums

### Enum File Naming

```
[entity]/enum/[entity]-[name].enum.ts
```

### Common Enums

| Enum                       | Values                                               |
| -------------------------- | ---------------------------------------------------- |
| `AccountTypeEnum`          | DEBT, CASH, BANK, CRYPTO, STOCKS, SAVINGS, BANK_SYNC |
| `AccountNatureEnum`        | ASSET, LIABILITY                                     |
| `TransactionTypeEnum`      | DEBT, INCOME, EXPENSE, TRANSFER, ADJUSTMENT          |
| `TransactionEntryTypeEnum` | DEBIT, CREDIT                                        |
| `LanguageEnum`             | EN, FR, UK, DE, ES                                   |
| `ThemeEnum`                | LIGHT, DARK, SYSTEM                                  |

### UserIconNameEnum

Large enum (1,637 icons) with all Lucide icon names. File-level `eslint-disable max-lines` is acceptable.

## Type Guards

Create type guards for entity narrowing:

```typescript
// transaction/type-guard/is-expense-transaction.type-guard.ts
export const isExpenseTransaction = (transaction: TransactionInterface): transaction is ExpenseTransactionInterface =>
    transaction.type === TransactionTypeEnum.EXPENSE;
```

## Soft Delete Pattern

All entities support soft delete via `deletedAt`:

```typescript
archiveById: (id: number) =>
    Db.query(db => db.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, id))),
restoreById: (id: number) =>
    Db.query(db => db.update(AccountEntityTable).set({ deletedAt: null }).where(eq(AccountEntityTable.id, id))),

where: isNull(AccountEntityTable.deletedAt)
```

## Testing

Production packages host no unit tests. Cover schemas through the integration suites under `tests/` and `pnpm ts` / `pnpm lint`.

## Export Rules

### Public API (index.ts)

Export everything consumers need:

- Entity types
- Input interfaces
- Schemas
- Repository classes
- Enums
- Constants

### Schema Aggregation (schema.ts)

Export all tables and relations for Drizzle:

```typescript
export { AccountEntityTable } from './account/table/account-entity.table';
export { AccountEntityRelations } from './account/relations/account-entity.relations';
// ... all entities
```

## After Changes

After modifying contracts, rebuild for app to see changes:

```bash
pnpm build
# Then in app:
cd ../app && pnpm db:generate  # If table structure changed
```
