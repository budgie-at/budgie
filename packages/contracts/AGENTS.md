# Contracts Package

Shared domain model: Drizzle ORM tables, Zod schemas, repository classes, and TypeScript types.

## Commands

```bash
yarn build    # Required after changes for app to see updates
yarn test     # Run Jest tests
```

## Structure

```
src/
├── @generic/             # Shared infrastructure (base columns, types, utils)
├── [entity]/             # Entity modules (13 total)
│   ├── constant/         # Validation limits
│   ├── entity/           # Inferred entity types
│   ├── enum/             # Entity enums
│   ├── input/            # Form input interfaces
│   ├── interface/        # Filter interfaces
│   ├── relations/        # Drizzle relations
│   ├── repository/       # Repository class
│   ├── schema/           # Zod schemas
│   └── table/            # Drizzle table definition
├── schema.ts             # Aggregated schema exports
└── index.ts              # Public API exports
```

**CRITICAL:** Flat structure only - each entity has folders at the same level, never nested deeper.

## Drizzle Tables

### Base Columns

All tables use `withBaseEntityTableColumns()`:

```typescript
export const AccountEntityTable = sqliteTable('accounts', {
    ...withBaseEntityTableColumns(),  // id, createdAt, updatedAt, deletedAt
    title: text('title').notNull(),
});
```

### Naming

- Table name: `snake_case` plural (`accounts`, `transaction_entries`)
- File name: `[entity]-entity.table.ts`

## Repository Pattern

```typescript
export class AccountRepository {
    constructor(private db: DB) {}

    // All write methods accept optional tx for transactions
    async create(input: AccountCreateInputInterface, tx?: TX): Promise<void> {
        await (tx ?? this.db).insert(AccountEntityTable).values(input);
    }

    // Query methods return Drizzle query objects
    findById(id: number) {
        return this.db.query.AccountEntityTable.findFirst({
            where: eq(AccountEntityTable.id, id),
            with: { instrument: true }
        });
    }
}
```

**Prefer** `db.query.[Entity].findMany/findFirst` over `db.select().from(...)`.

## Zod Schemas

Use `drizzle-zod` for automatic generation:

```typescript
import { createSelectSchema } from 'drizzle-zod';

export const AccountEntitySchema = createSelectSchema(AccountEntityTable, {
    type: zodEnum(AccountTypeEnum),
});

// Create schema: omit base fields
export const AccountCreateInputSchema = convertToCreateEntitySchema(AccountEntitySchema);
```

## Soft Delete

All entities support soft delete via `deletedAt`:

```typescript
// Archive
.set({ deletedAt: new Date() })

// Restore
.set({ deletedAt: null })

// Filter active
where: isNull(AccountEntityTable.deletedAt)
```

## Constants

Monetary values use integer precision:

```typescript
export const PRECISION = 1_000_000;
// Store $10.50 as 10_500_000
```

## After Changes

```bash
yarn build
cd ../app && yarn db:generate  # If table structure changed
```
