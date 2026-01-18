# Budget Tracking - Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement category budgets, overall budget, and budget progress tracking with a dashboard widget and management screens.

**Architecture:** Four new entities in contracts (Budget, BudgetCategoryLimit, BudgetIncomeExpectation, AccountBudgetExclusion) with repositories. App package gets calculation service, CRUD service, dashboard widget, detail screen, settings screen, and setup wizard.

**Tech Stack:** Drizzle ORM, Zod schemas, React Hook Form, NativeWind/CVA, Expo Router, TanStack Query patterns via useLiveQuery.

**Design Document:** See `docs/plans/2026-01-19-budget-tracking-design.md` for full requirements.

---

## Part 1: Contracts Package - Data Layer

### Task 1: Budget Period Enum

**Files:**
- Create: `packages/contracts/src/budget/enum/budget-period.enum.ts`
- Create: `packages/contracts/src/budget/index.ts` (barrel export)

**Step 1: Create enum file**

```typescript
// packages/contracts/src/budget/enum/budget-period.enum.ts
export enum BudgetPeriodEnum {
    WEEKLY = 'WEEKLY',
    BI_WEEKLY = 'BI_WEEKLY',
    MONTHLY = 'MONTHLY'
}
```

**Step 2: Create barrel export**

```typescript
// packages/contracts/src/budget/index.ts
export * from './enum/budget-period.enum';
```

**Step 3: Add to main contracts barrel**

Add to `packages/contracts/src/index.ts`:
```typescript
export * from './budget';
```

**Step 4: Commit**

```bash
git add packages/contracts/src/budget packages/contracts/src/index.ts
git commit -m "feat(contracts): add BudgetPeriodEnum"
```

---

### Task 2: Budget Table Definition

**Files:**
- Create: `packages/contracts/src/budget/table/budget-entity.table.ts`

**Reference:** See `packages/contracts/src/transaction/table/transaction-entity.table.ts` for pattern.

**Step 1: Create table file**

```typescript
// packages/contracts/src/budget/table/budget-entity.table.ts
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/table/with-base-entity-table-columns.util';
import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { BudgetPeriodEnum } from '../enum/budget-period.enum';

export const BudgetEntityTable = sqliteTable(
    'budgets',
    withBaseEntityTableColumns({
        name: text('name'),
        period: text('period', { enum: convertEnumToDrizzleEnum(BudgetPeriodEnum) })
            .$type<BudgetPeriodEnum>()
            .notNull(),
        periodStartDay: int('period_start_day').notNull().default(1),
        overallLimit: int('overall_limit').notNull(),
        startDate: int('start_date', { mode: 'timestamp' }).notNull(),
        endDate: int('end_date', { mode: 'timestamp' }).notNull()
    })
);
```

**Step 2: Export from barrel**

Add to `packages/contracts/src/budget/index.ts`:
```typescript
export * from './table/budget-entity.table';
```

**Step 3: Commit**

```bash
git add packages/contracts/src/budget
git commit -m "feat(contracts): add BudgetEntityTable"
```

---

### Task 3: Budget Entity Schema and Interface

**Files:**
- Create: `packages/contracts/src/budget/schema/budget-entity.schema.ts`
- Create: `packages/contracts/src/budget/entity/budget-entity.interface.ts`

**Step 1: Create schema file**

```typescript
// packages/contracts/src/budget/schema/budget-entity.schema.ts
import { createSelectSchema } from 'drizzle-zod';

import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetEntitySchema = createSelectSchema(BudgetEntityTable);
```

**Step 2: Create entity interface**

```typescript
// packages/contracts/src/budget/entity/budget-entity.interface.ts
import { infer as zodInfer } from 'zod';

import { BudgetEntitySchema } from '../schema/budget-entity.schema';

export interface BudgetEntityInterface extends zodInfer<typeof BudgetEntitySchema> {}
```

**Step 3: Export from barrel**

Add to `packages/contracts/src/budget/index.ts`:
```typescript
export * from './schema/budget-entity.schema';
export * from './entity/budget-entity.interface';
```

**Step 4: Commit**

```bash
git add packages/contracts/src/budget
git commit -m "feat(contracts): add Budget entity schema and interface"
```

---

### Task 4: Budget Create Input Schema and Interface

**Files:**
- Create: `packages/contracts/src/budget/schema/budget-create-entity.schema.ts`
- Create: `packages/contracts/src/budget/schema/budget-create-input.schema.ts`
- Create: `packages/contracts/src/budget/input/budget-create-input.interface.ts`

**Step 1: Create entity schema (for DB insert)**

```typescript
// packages/contracts/src/budget/schema/budget-create-entity.schema.ts
import { createInsertSchema } from 'drizzle-zod';

import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetCreateEntitySchema = createInsertSchema(BudgetEntityTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
```

**Step 2: Create input schema (for forms)**

```typescript
// packages/contracts/src/budget/schema/budget-create-input.schema.ts
import { array, number } from 'zod';

import { BudgetCategoryLimitCreateInputSchema } from '../../budget-category-limit/schema/budget-category-limit-create-input.schema';
import { BudgetIncomeExpectationCreateInputSchema } from '../../budget-income-expectation/schema/budget-income-expectation-create-input.schema';
import { BudgetCreateEntitySchema } from './budget-create-entity.schema';

export const BudgetCreateInputSchema = BudgetCreateEntitySchema.extend({
    categoryLimits: array(BudgetCategoryLimitCreateInputSchema),
    incomeExpectations: array(BudgetIncomeExpectationCreateInputSchema)
});
```

**Note:** This file depends on BudgetCategoryLimit and BudgetIncomeExpectation schemas. Create placeholder files first or implement those entities before this step.

**Step 3: Create input interface**

```typescript
// packages/contracts/src/budget/input/budget-create-input.interface.ts
import { infer as zodInfer } from 'zod';

import { BudgetCreateInputSchema } from '../schema/budget-create-input.schema';

export interface BudgetCreateInputInterface extends zodInfer<typeof BudgetCreateInputSchema> {}
```

**Step 4: Export from barrel**

Add to `packages/contracts/src/budget/index.ts`:
```typescript
export * from './schema/budget-create-entity.schema';
export * from './schema/budget-create-input.schema';
export * from './input/budget-create-input.interface';
```

**Step 5: Commit**

```bash
git add packages/contracts/src/budget
git commit -m "feat(contracts): add Budget create schemas and input interface"
```

---

### Task 5: BudgetCategoryLimit Entity

**Files:**
- Create: `packages/contracts/src/budget-category-limit/table/budget-category-limit-entity.table.ts`
- Create: `packages/contracts/src/budget-category-limit/schema/budget-category-limit-entity.schema.ts`
- Create: `packages/contracts/src/budget-category-limit/entity/budget-category-limit-entity.interface.ts`
- Create: `packages/contracts/src/budget-category-limit/index.ts`

**Step 1: Create table**

```typescript
// packages/contracts/src/budget-category-limit/table/budget-category-limit-entity.table.ts
import { int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/table/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

export const BudgetCategoryLimitEntityTable = sqliteTable(
    'budget_category_limits',
    withBaseEntityTableColumns({
        budgetId: int('budget_id')
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        categoryId: int('category_id')
            .notNull()
            .references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        limit: int('limit').notNull()
    })
);
```

**Step 2: Create schema**

```typescript
// packages/contracts/src/budget-category-limit/schema/budget-category-limit-entity.schema.ts
import { createSelectSchema } from 'drizzle-zod';

import { BudgetCategoryLimitEntityTable } from '../table/budget-category-limit-entity.table';

export const BudgetCategoryLimitEntitySchema = createSelectSchema(BudgetCategoryLimitEntityTable);
```

**Step 3: Create entity interface**

```typescript
// packages/contracts/src/budget-category-limit/entity/budget-category-limit-entity.interface.ts
import { infer as zodInfer } from 'zod';

import { BudgetCategoryLimitEntitySchema } from '../schema/budget-category-limit-entity.schema';

export interface BudgetCategoryLimitEntityInterface extends zodInfer<typeof BudgetCategoryLimitEntitySchema> {}
```

**Step 4: Create input schema**

```typescript
// packages/contracts/src/budget-category-limit/schema/budget-category-limit-create-input.schema.ts
import { number, object } from 'zod';

export const BudgetCategoryLimitCreateInputSchema = object({
    categoryId: number().int().positive(),
    limit: number().int().positive()
});
```

**Step 5: Create input interface**

```typescript
// packages/contracts/src/budget-category-limit/input/budget-category-limit-create-input.interface.ts
import { infer as zodInfer } from 'zod';

import { BudgetCategoryLimitCreateInputSchema } from '../schema/budget-category-limit-create-input.schema';

export interface BudgetCategoryLimitCreateInputInterface extends zodInfer<typeof BudgetCategoryLimitCreateInputSchema> {}
```

**Step 6: Create barrel export**

```typescript
// packages/contracts/src/budget-category-limit/index.ts
export * from './table/budget-category-limit-entity.table';
export * from './schema/budget-category-limit-entity.schema';
export * from './schema/budget-category-limit-create-input.schema';
export * from './entity/budget-category-limit-entity.interface';
export * from './input/budget-category-limit-create-input.interface';
```

**Step 7: Add to main barrel**

Add to `packages/contracts/src/index.ts`:
```typescript
export * from './budget-category-limit';
```

**Step 8: Commit**

```bash
git add packages/contracts/src/budget-category-limit packages/contracts/src/index.ts
git commit -m "feat(contracts): add BudgetCategoryLimit entity"
```

---

### Task 6: BudgetIncomeExpectation Entity

**Files:**
- Create: `packages/contracts/src/budget-income-expectation/table/budget-income-expectation-entity.table.ts`
- Create: `packages/contracts/src/budget-income-expectation/schema/budget-income-expectation-entity.schema.ts`
- Create: `packages/contracts/src/budget-income-expectation/entity/budget-income-expectation-entity.interface.ts`
- Create: `packages/contracts/src/budget-income-expectation/schema/budget-income-expectation-create-input.schema.ts`
- Create: `packages/contracts/src/budget-income-expectation/input/budget-income-expectation-create-input.interface.ts`
- Create: `packages/contracts/src/budget-income-expectation/index.ts`

**Step 1: Create table**

```typescript
// packages/contracts/src/budget-income-expectation/table/budget-income-expectation-entity.table.ts
import { int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/table/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

export const BudgetIncomeExpectationEntityTable = sqliteTable(
    'budget_income_expectations',
    withBaseEntityTableColumns({
        budgetId: int('budget_id')
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        categoryId: int('category_id')
            .notNull()
            .references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        expectedAmount: int('expected_amount').notNull()
    })
);
```

**Step 2: Create schema, interface, input schema, input interface (same pattern as Task 5)**

**Step 3: Create barrel and add to main**

**Step 4: Commit**

```bash
git add packages/contracts/src/budget-income-expectation packages/contracts/src/index.ts
git commit -m "feat(contracts): add BudgetIncomeExpectation entity"
```

---

### Task 7: AccountBudgetExclusion Entity

**Files:**
- Create: `packages/contracts/src/account-budget-exclusion/table/account-budget-exclusion-entity.table.ts`
- Create: `packages/contracts/src/account-budget-exclusion/schema/account-budget-exclusion-entity.schema.ts`
- Create: `packages/contracts/src/account-budget-exclusion/entity/account-budget-exclusion-entity.interface.ts`
- Create: `packages/contracts/src/account-budget-exclusion/index.ts`

**Step 1: Create table**

```typescript
// packages/contracts/src/account-budget-exclusion/table/account-budget-exclusion-entity.table.ts
import { int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/table/with-base-entity-table-columns.util';
import { AccountEntityTable } from '../../account/table/account-entity.table';

export const AccountBudgetExclusionEntityTable = sqliteTable(
    'account_budget_exclusions',
    withBaseEntityTableColumns({
        accountId: int('account_id')
            .notNull()
            .references(() => AccountEntityTable.id, { onDelete: 'cascade' })
            .unique()
    })
);
```

**Step 2: Create schema and interface (same pattern)**

**Step 3: Create barrel and add to main**

**Step 4: Commit**

```bash
git add packages/contracts/src/account-budget-exclusion packages/contracts/src/index.ts
git commit -m "feat(contracts): add AccountBudgetExclusion entity"
```

---

### Task 8: Budget Relations

**Files:**
- Create: `packages/contracts/src/budget/relations/budget-entity.relations.ts`
- Create: `packages/contracts/src/budget-category-limit/relations/budget-category-limit-entity.relations.ts`
- Create: `packages/contracts/src/budget-income-expectation/relations/budget-income-expectation-entity.relations.ts`

**Step 1: Create Budget relations**

```typescript
// packages/contracts/src/budget/relations/budget-entity.relations.ts
import { relations } from 'drizzle-orm';

import { BudgetCategoryLimitEntityTable } from '../../budget-category-limit/table/budget-category-limit-entity.table';
import { BudgetIncomeExpectationEntityTable } from '../../budget-income-expectation/table/budget-income-expectation-entity.table';
import { BudgetEntityTable } from '../table/budget-entity.table';

export const budgetEntityRelations = relations(BudgetEntityTable, ({ many }) => ({
    categoryLimits: many(BudgetCategoryLimitEntityTable),
    incomeExpectations: many(BudgetIncomeExpectationEntityTable)
}));
```

**Step 2: Create BudgetCategoryLimit relations**

```typescript
// packages/contracts/src/budget-category-limit/relations/budget-category-limit-entity.relations.ts
import { relations } from 'drizzle-orm';

import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetCategoryLimitEntityTable } from '../table/budget-category-limit-entity.table';

export const budgetCategoryLimitEntityRelations = relations(BudgetCategoryLimitEntityTable, ({ one }) => ({
    budget: one(BudgetEntityTable, {
        fields: [BudgetCategoryLimitEntityTable.budgetId],
        references: [BudgetEntityTable.id]
    }),
    category: one(CategoryEntityTable, {
        fields: [BudgetCategoryLimitEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    })
}));
```

**Step 3: Create BudgetIncomeExpectation relations (same pattern)**

**Step 4: Export from barrels**

**Step 5: Commit**

```bash
git add packages/contracts/src/budget packages/contracts/src/budget-category-limit packages/contracts/src/budget-income-expectation
git commit -m "feat(contracts): add budget entity relations"
```

---

### Task 9: Budget Repository

**Files:**
- Create: `packages/contracts/src/budget/repository/budget.repository.ts`

**Reference:** See `packages/contracts/src/transaction/repository/transaction.repository.ts`

**Step 1: Create repository**

```typescript
// packages/contracts/src/budget/repository/budget.repository.ts
import { eq } from 'drizzle-orm';
import { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { schema, TX } from '../../@generic';
import { BudgetEntityInterface } from '../entity/budget-entity.interface';
import { BudgetEntityTable } from '../table/budget-entity.table';

type DB = ExpoSQLiteDatabase<typeof schema>;

export class BudgetRepository {
    constructor(private db: DB) {}

    async getActive(): Promise<BudgetEntityInterface | undefined> {
        return this.db.query.BudgetEntityTable.findFirst({
            with: {
                categoryLimits: {
                    with: {
                        category: true
                    }
                },
                incomeExpectations: {
                    with: {
                        category: true
                    }
                }
            },
            orderBy: (budget, { desc }) => [desc(budget.createdAt)]
        });
    }

    async getById(id: number): Promise<BudgetEntityInterface | undefined> {
        return this.db.query.BudgetEntityTable.findFirst({
            where: eq(BudgetEntityTable.id, id),
            with: {
                categoryLimits: {
                    with: {
                        category: true
                    }
                },
                incomeExpectations: {
                    with: {
                        category: true
                    }
                }
            }
        });
    }

    async create(
        input: Omit<BudgetEntityInterface, 'id' | 'createdAt' | 'updatedAt'>,
        transaction?: TX
    ): Promise<BudgetEntityInterface> {
        const database = transaction ?? this.db;
        const [budget] = await database.insert(BudgetEntityTable).values(input).returning();

        return budget;
    }

    async updateById(
        id: number,
        input: Partial<Omit<BudgetEntityInterface, 'id' | 'createdAt' | 'updatedAt'>>,
        transaction?: TX
    ): Promise<BudgetEntityInterface> {
        const database = transaction ?? this.db;
        const [budget] = await database
            .update(BudgetEntityTable)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(BudgetEntityTable.id, id))
            .returning();

        return budget;
    }

    async deleteById(id: number, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database.delete(BudgetEntityTable).where(eq(BudgetEntityTable.id, id));
    }
}
```

**Step 2: Export from barrel**

**Step 3: Commit**

```bash
git add packages/contracts/src/budget
git commit -m "feat(contracts): add BudgetRepository"
```

---

### Task 10: BudgetCategoryLimit Repository

**Files:**
- Create: `packages/contracts/src/budget-category-limit/repository/budget-category-limit.repository.ts`

**Step 1: Create repository**

```typescript
// packages/contracts/src/budget-category-limit/repository/budget-category-limit.repository.ts
import { eq } from 'drizzle-orm';
import { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { schema, TX } from '../../@generic';
import { BudgetCategoryLimitEntityInterface } from '../entity/budget-category-limit-entity.interface';
import { BudgetCategoryLimitCreateInputInterface } from '../input/budget-category-limit-create-input.interface';
import { BudgetCategoryLimitEntityTable } from '../table/budget-category-limit-entity.table';

type DB = ExpoSQLiteDatabase<typeof schema>;

export class BudgetCategoryLimitRepository {
    constructor(private db: DB) {}

    async getByBudgetId(budgetId: number): Promise<BudgetCategoryLimitEntityInterface[]> {
        return this.db.query.BudgetCategoryLimitEntityTable.findMany({
            where: eq(BudgetCategoryLimitEntityTable.budgetId, budgetId),
            with: {
                category: true
            }
        });
    }

    async bulkCreate(
        budgetId: number,
        inputs: BudgetCategoryLimitCreateInputInterface[],
        transaction?: TX
    ): Promise<BudgetCategoryLimitEntityInterface[]> {
        const database = transaction ?? this.db;
        const values = inputs.map(input => ({ ...input, budgetId }));

        return database.insert(BudgetCategoryLimitEntityTable).values(values).returning();
    }

    async deleteByBudgetId(budgetId: number, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database.delete(BudgetCategoryLimitEntityTable).where(eq(BudgetCategoryLimitEntityTable.budgetId, budgetId));
    }
}
```

**Step 2: Export and commit**

```bash
git add packages/contracts/src/budget-category-limit
git commit -m "feat(contracts): add BudgetCategoryLimitRepository"
```

---

### Task 11: BudgetIncomeExpectation Repository

**Files:**
- Create: `packages/contracts/src/budget-income-expectation/repository/budget-income-expectation.repository.ts`

**Same pattern as Task 10**

**Commit:**

```bash
git add packages/contracts/src/budget-income-expectation
git commit -m "feat(contracts): add BudgetIncomeExpectationRepository"
```

---

### Task 12: AccountBudgetExclusion Repository

**Files:**
- Create: `packages/contracts/src/account-budget-exclusion/repository/account-budget-exclusion.repository.ts`

**Step 1: Create repository**

```typescript
// packages/contracts/src/account-budget-exclusion/repository/account-budget-exclusion.repository.ts
import { eq, inArray } from 'drizzle-orm';
import { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { schema, TX } from '../../@generic';
import { AccountBudgetExclusionEntityInterface } from '../entity/account-budget-exclusion-entity.interface';
import { AccountBudgetExclusionEntityTable } from '../table/account-budget-exclusion-entity.table';

type DB = ExpoSQLiteDatabase<typeof schema>;

export class AccountBudgetExclusionRepository {
    constructor(private db: DB) {}

    async getAll(): Promise<AccountBudgetExclusionEntityInterface[]> {
        return this.db.query.AccountBudgetExclusionEntityTable.findMany();
    }

    async getExcludedAccountIds(): Promise<number[]> {
        const exclusions = await this.getAll();

        return exclusions.map(exclusion => exclusion.accountId);
    }

    async isExcluded(accountId: number): Promise<boolean> {
        const exclusion = await this.db.query.AccountBudgetExclusionEntityTable.findFirst({
            where: eq(AccountBudgetExclusionEntityTable.accountId, accountId)
        });

        return exclusion !== undefined;
    }

    async exclude(accountId: number, transaction?: TX): Promise<AccountBudgetExclusionEntityInterface> {
        const database = transaction ?? this.db;
        const [exclusion] = await database
            .insert(AccountBudgetExclusionEntityTable)
            .values({ accountId })
            .onConflictDoNothing()
            .returning();

        return exclusion;
    }

    async include(accountId: number, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database.delete(AccountBudgetExclusionEntityTable).where(eq(AccountBudgetExclusionEntityTable.accountId, accountId));
    }
}
```

**Commit:**

```bash
git add packages/contracts/src/account-budget-exclusion
git commit -m "feat(contracts): add AccountBudgetExclusionRepository"
```

---

### Task 13: Update Schema Exports and Build Contracts

**Files:**
- Modify: `packages/contracts/src/@generic/drizzle/schema.ts`

**Step 1: Add new tables and relations to schema**

Add imports and exports for:
- `BudgetEntityTable`
- `BudgetCategoryLimitEntityTable`
- `BudgetIncomeExpectationEntityTable`
- `AccountBudgetExclusionEntityTable`
- All relations

**Step 2: Build contracts package**

Run: `yarn build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/contracts
git commit -m "feat(contracts): export budget schemas and complete contracts layer"
```

---

## Part 2: App Package - Database Setup

### Task 14: Add Repository Instances

**Files:**
- Modify: `packages/app/src/@generic/drizzle/db/db.ts`

**Step 1: Import and instantiate repositories**

Add:
```typescript
import { BudgetRepository, BudgetCategoryLimitRepository, BudgetIncomeExpectationRepository, AccountBudgetExclusionRepository } from '@budgie/contracts';

export const budgetRepository = new BudgetRepository(db);
export const budgetCategoryLimitRepository = new BudgetCategoryLimitRepository(db);
export const budgetIncomeExpectationRepository = new BudgetIncomeExpectationRepository(db);
export const accountBudgetExclusionRepository = new AccountBudgetExclusionRepository(db);
```

**Step 2: Commit**

```bash
git add packages/app/src/@generic/drizzle/db/db.ts
git commit -m "feat(app): add budget repository instances"
```

---

### Task 15: Generate Database Migration

**Step 1: Run migration generator**

```bash
cd packages/app && yarn db:generate
```

**Step 2: Verify migration file created**

Check `packages/app/drizzle/` for new migration file.

**Step 3: Commit**

```bash
git add packages/app/drizzle
git commit -m "feat(app): add budget tables migration"
```

---

## Part 3: App Package - Services

### Task 16: Budget Status Enum

**Files:**
- Create: `packages/app/src/budget/enum/budget-status.enum.ts`

**Step 1: Create enum**

```typescript
// packages/app/src/budget/enum/budget-status.enum.ts
export enum BudgetStatusEnum {
    ON_TRACK = 'ON_TRACK',
    WARNING = 'WARNING',
    OVER = 'OVER'
}
```

**Step 2: Commit**

```bash
git add packages/app/src/budget
git commit -m "feat(app): add BudgetStatusEnum"
```

---

### Task 17: Budget Calculation Interfaces

**Files:**
- Create: `packages/app/src/budget/interface/budget-category-status.interface.ts`
- Create: `packages/app/src/budget/interface/budget-calculation-result.interface.ts`

**Step 1: Create category status interface**

```typescript
// packages/app/src/budget/interface/budget-category-status.interface.ts
import { CategoryEntityInterface } from '@budgie/contracts';

import { BudgetStatusEnum } from '../enum/budget-status.enum';

export interface BudgetCategoryStatusInterface {
    readonly category: CategoryEntityInterface;
    readonly limit: number;
    readonly spent: number;
    readonly remaining: number;
    readonly percentage: number;
    readonly status: BudgetStatusEnum;
}
```

**Step 2: Create calculation result interface**

```typescript
// packages/app/src/budget/interface/budget-calculation-result.interface.ts
import { BudgetEntityInterface } from '@budgie/contracts';

import { BudgetStatusEnum } from '../enum/budget-status.enum';
import { BudgetCategoryStatusInterface } from './budget-category-status.interface';

export interface BudgetIncomeStatusInterface {
    readonly categoryId: number;
    readonly categoryName: string;
    readonly expected: number;
    readonly actual: number;
    readonly variance: number;
}

export interface BudgetCalculationResultInterface {
    readonly budget: BudgetEntityInterface;
    readonly totalSpent: number;
    readonly overallRemaining: number;
    readonly overallPercentage: number;
    readonly overallStatus: BudgetStatusEnum;
    readonly allocatedAmount: number;
    readonly unallocatedBuffer: number;
    readonly categoryStatuses: BudgetCategoryStatusInterface[];
    readonly incomeStatuses: BudgetIncomeStatusInterface[];
    readonly totalExpectedIncome: number;
    readonly totalActualIncome: number;
    readonly incomeVariance: number;
    readonly daysInPeriod: number;
    readonly daysElapsed: number;
    readonly dailyBudget: number;
    readonly expectedSpentByNow: number;
    readonly isOnPace: boolean;
    readonly paceVariance: number;
    readonly warningCount: number;
}
```

**Step 3: Commit**

```bash
git add packages/app/src/budget/interface
git commit -m "feat(app): add budget calculation interfaces"
```

---

### Task 18: Budget Calculation Service

**Files:**
- Create: `packages/app/src/budget/service/budget-calculation.service.ts`

**Step 1: Create service**

```typescript
// packages/app/src/budget/service/budget-calculation.service.ts
import { BudgetEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { differenceInDays } from 'date-fns';

import { accountBudgetExclusionRepository } from '../../@generic/drizzle/db/db';
import { transactionRepository } from '../../@generic/drizzle/db/db';
import { BudgetStatusEnum } from '../enum/budget-status.enum';
import { BudgetCalculationResultInterface, BudgetIncomeStatusInterface } from '../interface/budget-calculation-result.interface';
import { BudgetCategoryStatusInterface } from '../interface/budget-category-status.interface';

class BudgetCalculationService {
    async calculate(budget: BudgetEntityInterface): Promise<BudgetCalculationResultInterface> {
        const excludedAccountIds = await accountBudgetExclusionRepository.getExcludedAccountIds();

        const transactions = await transactionRepository.getByDateRange(
            budget.startDate,
            budget.endDate,
            excludedAccountIds
        );

        const expenses = transactions.filter(
            transaction => transaction.type === TransactionTypeEnum.EXPENSE
        );
        const incomes = transactions.filter(
            transaction => transaction.type === TransactionTypeEnum.INCOME
        );

        const totalSpent = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
        const overallRemaining = budget.overallLimit - totalSpent;
        const overallPercentage = (totalSpent / budget.overallLimit) * 100;
        const overallStatus = this.getStatus(overallPercentage);

        const categoryStatuses = this.calculateCategoryStatuses(budget, expenses);
        const incomeStatuses = this.calculateIncomeStatuses(budget, incomes);

        const allocatedAmount = budget.categoryLimits?.reduce((sum, limit) => sum + limit.limit, 0) ?? 0;
        const unallocatedBuffer = budget.overallLimit - allocatedAmount;

        const totalExpectedIncome = budget.incomeExpectations?.reduce((sum, expectation) => sum + expectation.expectedAmount, 0) ?? 0;
        const totalActualIncome = incomes.reduce((sum, transaction) => sum + transaction.amount, 0);
        const incomeVariance = totalActualIncome - totalExpectedIncome;

        const daysInPeriod = differenceInDays(budget.endDate, budget.startDate) + 1;
        const daysElapsed = differenceInDays(new Date(), budget.startDate) + 1;
        const dailyBudget = budget.overallLimit / daysInPeriod;
        const expectedSpentByNow = dailyBudget * Math.min(daysElapsed, daysInPeriod);
        const isOnPace = totalSpent <= expectedSpentByNow;
        const paceVariance = totalSpent - expectedSpentByNow;

        const warningCount = categoryStatuses.filter(
            status => status.status === BudgetStatusEnum.WARNING || status.status === BudgetStatusEnum.OVER
        ).length;

        return {
            budget,
            totalSpent,
            overallRemaining,
            overallPercentage,
            overallStatus,
            allocatedAmount,
            unallocatedBuffer,
            categoryStatuses,
            incomeStatuses,
            totalExpectedIncome,
            totalActualIncome,
            incomeVariance,
            daysInPeriod,
            daysElapsed,
            dailyBudget,
            expectedSpentByNow,
            isOnPace,
            paceVariance,
            warningCount
        };
    }

    private calculateCategoryStatuses(
        budget: BudgetEntityInterface,
        expenses: Array<{ categoryId: number; amount: number }>
    ): BudgetCategoryStatusInterface[] {
        const categoryLimits = budget.categoryLimits ?? [];

        return categoryLimits.map(categoryLimit => {
            const spent = expenses
                .filter(expense => expense.categoryId === categoryLimit.categoryId)
                .reduce((sum, expense) => sum + expense.amount, 0);

            const remaining = categoryLimit.limit - spent;
            const percentage = (spent / categoryLimit.limit) * 100;
            const status = this.getStatus(percentage);

            return {
                category: categoryLimit.category,
                limit: categoryLimit.limit,
                spent,
                remaining,
                percentage,
                status
            };
        });
    }

    private calculateIncomeStatuses(
        budget: BudgetEntityInterface,
        incomes: Array<{ categoryId: number; amount: number }>
    ): BudgetIncomeStatusInterface[] {
        const incomeExpectations = budget.incomeExpectations ?? [];

        return incomeExpectations.map(expectation => {
            const actual = incomes
                .filter(income => income.categoryId === expectation.categoryId)
                .reduce((sum, income) => sum + income.amount, 0);

            return {
                categoryId: expectation.categoryId,
                categoryName: expectation.category?.name ?? '',
                expected: expectation.expectedAmount,
                actual,
                variance: actual - expectation.expectedAmount
            };
        });
    }

    private getStatus(percentage: number): BudgetStatusEnum {
        if (percentage >= 100) {
            return BudgetStatusEnum.OVER;
        }
        if (percentage >= 80) {
            return BudgetStatusEnum.WARNING;
        }

        return BudgetStatusEnum.ON_TRACK;
    }
}

export const budgetCalculationService = new BudgetCalculationService();
```

**Note:** This service needs `transactionRepository.getByDateRange()` method. May need to add it to TransactionRepository.

**Step 2: Commit**

```bash
git add packages/app/src/budget/service
git commit -m "feat(app): add BudgetCalculationService"
```

---

### Task 19: Budget Service

**Files:**
- Create: `packages/app/src/budget/service/budget.service.ts`

**Step 1: Create service**

```typescript
// packages/app/src/budget/service/budget.service.ts
import { BudgetCreateInputInterface, BudgetEntityInterface, BudgetPeriodEnum } from '@budgie/contracts';
import { addDays, addMonths, addWeeks, startOfDay } from 'date-fns';

import { db } from '../../@generic/drizzle/db/db';
import { budgetRepository, budgetCategoryLimitRepository, budgetIncomeExpectationRepository } from '../../@generic/drizzle/db/db';

class BudgetService {
    async getActive(): Promise<BudgetEntityInterface | undefined> {
        const budget = await budgetRepository.getActive();

        if (budget && this.isPeriodExpired(budget)) {
            return this.rolloverToNewPeriod(budget);
        }

        return budget;
    }

    async create(input: BudgetCreateInputInterface): Promise<BudgetEntityInterface> {
        const { categoryLimits, incomeExpectations, ...budgetData } = input;
        const { startDate, endDate } = this.calculatePeriodDates(budgetData.period, budgetData.periodStartDay);

        return db.transaction(async transaction => {
            const budget = await budgetRepository.create(
                { ...budgetData, startDate, endDate },
                transaction
            );

            if (categoryLimits.length > 0) {
                await budgetCategoryLimitRepository.bulkCreate(budget.id, categoryLimits, transaction);
            }

            if (incomeExpectations.length > 0) {
                await budgetIncomeExpectationRepository.bulkCreate(budget.id, incomeExpectations, transaction);
            }

            return budgetRepository.getById(budget.id) as Promise<BudgetEntityInterface>;
        });
    }

    async update(id: number, input: BudgetCreateInputInterface): Promise<BudgetEntityInterface> {
        const { categoryLimits, incomeExpectations, ...budgetData } = input;

        return db.transaction(async transaction => {
            await budgetRepository.updateById(id, budgetData, transaction);

            await budgetCategoryLimitRepository.deleteByBudgetId(id, transaction);
            if (categoryLimits.length > 0) {
                await budgetCategoryLimitRepository.bulkCreate(id, categoryLimits, transaction);
            }

            await budgetIncomeExpectationRepository.deleteByBudgetId(id, transaction);
            if (incomeExpectations.length > 0) {
                await budgetIncomeExpectationRepository.bulkCreate(id, incomeExpectations, transaction);
            }

            return budgetRepository.getById(id) as Promise<BudgetEntityInterface>;
        });
    }

    async deleteById(id: number): Promise<void> {
        await budgetRepository.deleteById(id);
    }

    private isPeriodExpired(budget: BudgetEntityInterface): boolean {
        return new Date() > budget.endDate;
    }

    private async rolloverToNewPeriod(budget: BudgetEntityInterface): Promise<BudgetEntityInterface> {
        const { startDate, endDate } = this.calculatePeriodDates(budget.period, budget.periodStartDay);

        return budgetRepository.updateById(budget.id, { startDate, endDate });
    }

    private calculatePeriodDates(period: BudgetPeriodEnum, startDay: number): { startDate: Date; endDate: Date } {
        const today = startOfDay(new Date());
        const currentDay = today.getDate();

        let startDate: Date;
        if (currentDay >= startDay) {
            startDate = new Date(today.getFullYear(), today.getMonth(), startDay);
        } else {
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, startDay);
        }

        let endDate: Date;
        switch (period) {
            case BudgetPeriodEnum.WEEKLY:
                endDate = addDays(addWeeks(startDate, 1), -1);
                break;
            case BudgetPeriodEnum.BI_WEEKLY:
                endDate = addDays(addWeeks(startDate, 2), -1);
                break;
            case BudgetPeriodEnum.MONTHLY:
            default:
                endDate = addDays(addMonths(startDate, 1), -1);
                break;
        }

        return { startDate, endDate };
    }
}

export const budgetService = new BudgetService();
```

**Step 2: Commit**

```bash
git add packages/app/src/budget/service
git commit -m "feat(app): add BudgetService"
```

---

## Part 4: App Package - Queries

### Task 20: Budget Queries

**Files:**
- Create: `packages/app/src/budget/query/use-get-active-budget.query.ts`
- Create: `packages/app/src/budget/query/use-get-budget-calculation.query.ts`

**Step 1: Create active budget query**

```typescript
// packages/app/src/budget/query/use-get-active-budget.query.ts
import { isDefined } from '@rnw-community/shared';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { budgetRepository } from '../../@generic/drizzle/db/db';

export const useGetActiveBudgetQuery = () => {
    const { data, error, updatedAt } = useLiveQuery(budgetRepository.getActive());

    return isDefined(updatedAt)
        ? { budget: data, isLoading: false, error: error ?? null }
        : { budget: null, isLoading: true, error: null };
};
```

**Step 2: Create calculation query (uses useEffect pattern for derived data)**

```typescript
// packages/app/src/budget/query/use-get-budget-calculation.query.ts
import { BudgetEntityInterface } from '@budgie/contracts';
import { isDefined } from '@rnw-community/shared';
import { useEffect, useState } from 'react';

import { BudgetCalculationResultInterface } from '../interface/budget-calculation-result.interface';
import { budgetCalculationService } from '../service/budget-calculation.service';

export const useGetBudgetCalculationQuery = (budget: BudgetEntityInterface | null | undefined) => {
    const [calculation, setCalculation] = useState<BudgetCalculationResultInterface | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isDefined(budget)) {
            setCalculation(null);

            return;
        }

        setIsLoading(true);
        budgetCalculationService
            .calculate(budget)
            .then(setCalculation)
            .finally(() => setIsLoading(false));
    }, [budget]);

    return { calculation, isLoading };
};
```

**Step 3: Commit**

```bash
git add packages/app/src/budget/query
git commit -m "feat(app): add budget queries"
```

---

## Part 5: App Package - Components

### Task 21: Budget Progress Bar Component

**Files:**
- Create: `packages/app/src/budget/components/budget-progress-bar/budget-progress-bar.tsx`

**Step 1: Create component**

```typescript
// packages/app/src/budget/components/budget-progress-bar/budget-progress-bar.tsx
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { BudgetStatusEnum } from '../../enum/budget-status.enum';

interface Props {
    readonly percentage: number;
    readonly status: BudgetStatusEnum;
    readonly size?: 'sm' | 'md';
}

const trackVariants = cva('rounded-full bg-secondary-background', {
    variants: {
        size: {
            sm: 'h-2',
            md: 'h-3'
        }
    }
});

const fillVariants = cva('rounded-full', {
    variants: {
        status: {
            [BudgetStatusEnum.ON_TRACK]: 'bg-positive-background',
            [BudgetStatusEnum.WARNING]: 'bg-warning-background',
            [BudgetStatusEnum.OVER]: 'bg-destructive-background'
        },
        size: {
            sm: 'h-2',
            md: 'h-3'
        }
    }
});

export const BudgetProgressBar = ({ percentage, status, size = 'md' }: Props) => {
    const clampedPercentage = Math.min(percentage, 100);

    return (
        <View className={trackVariants({ size })}>
            <View
                className={fillVariants({ status, size })}
                style={{ width: `${clampedPercentage}%` }}
            />
        </View>
    );
};
```

**Step 2: Commit**

```bash
git add packages/app/src/budget/components
git commit -m "feat(app): add BudgetProgressBar component"
```

---

### Task 22: Budget Category Row Component

**Files:**
- Create: `packages/app/src/budget/components/budget-category-row/budget-category-row.tsx`

**Step 1: Create component**

```typescript
// packages/app/src/budget/components/budget-category-row/budget-category-row.tsx
import { Trans } from '@lingui/react/macro';
import { View } from 'react-native';

import { Text } from '../../../@generic/component/text/text';
import { useFormatAmount } from '../../../@generic/hook/use-format-amount.hook';
import { BudgetCategoryStatusInterface } from '../../interface/budget-category-status.interface';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly categoryStatus: BudgetCategoryStatusInterface;
}

export const BudgetCategoryRow = ({ categoryStatus }: Props) => {
    const { formatAmount } = useFormatAmount();
    const { category, spent, limit, percentage, status, remaining } = categoryStatus;

    const isOver = remaining < 0;

    return (
        <View className="gap-y-sm">
            <View className="flex-row justify-between">
                <Text className="text-primary font-medium">{category.name}</Text>
                <Text className="text-secondary-foreground">
                    {formatAmount(spent)} / {formatAmount(limit)}
                </Text>
            </View>
            <BudgetProgressBar percentage={percentage} status={status} size="sm" />
            <View className="flex-row justify-between">
                <Text className="text-tertiary-foreground text-sm">
                    {Math.round(percentage)}%
                </Text>
                <Text className={isOver ? 'text-destructive-foreground text-sm' : 'text-tertiary-foreground text-sm'}>
                    {isOver ? (
                        <Trans>{formatAmount(Math.abs(remaining))} over</Trans>
                    ) : (
                        <Trans>{formatAmount(remaining)} left</Trans>
                    )}
                </Text>
            </View>
        </View>
    );
};
```

**Step 2: Commit**

```bash
git add packages/app/src/budget/components
git commit -m "feat(app): add BudgetCategoryRow component"
```

---

### Task 23: Budget Widget Component

**Files:**
- Create: `packages/app/src/budget/components/budget-widget/budget-widget.tsx`

**Step 1: Create component**

```typescript
// packages/app/src/budget/components/budget-widget/budget-widget.tsx
import { Trans } from '@lingui/react/macro';
import { useLingui } from '@lingui/react';
import { isDefined, isPositiveNumber } from '@rnw-community/shared';
import { Link } from 'expo-router';
import { View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Text } from '../../../@generic/component/text/text';
import { useFormatAmount } from '../../../@generic/hook/use-format-amount.hook';
import { BudgetStatusEnum } from '../../enum/budget-status.enum';
import { BudgetCalculationResultInterface } from '../../interface/budget-calculation-result.interface';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly calculation: BudgetCalculationResultInterface | null;
    readonly isLoading: boolean;
}

export const BudgetWidget = ({ calculation, isLoading }: Props) => {
    const { t } = useLingui();
    const { formatAmount } = useFormatAmount();

    if (isLoading) {
        return (
            <Card className="p-xl">
                <Text className="text-secondary-foreground"><Trans>Loading budget...</Trans></Text>
            </Card>
        );
    }

    if (!isDefined(calculation)) {
        return (
            <Link href="/budget/setup" asChild>
                <Card className="p-xl">
                    <Text className="text-primary font-medium"><Trans>Set up your budget</Trans></Text>
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Track your spending and stay on target</Trans>
                    </Text>
                </Card>
            </Link>
        );
    }

    const { totalSpent, budget, overallPercentage, overallStatus, isOnPace, paceVariance, warningCount } = calculation;

    return (
        <Link href="/budget" asChild>
            <Card className="p-xl gap-y-md">
                <View className="flex-row justify-between items-center">
                    <Text className="text-primary font-medium"><Trans>Budget</Trans></Text>
                    {isPositiveNumber(warningCount) ? (
                        <View className="bg-warning-background rounded-full px-sm py-xs">
                            <Text className="text-warning-foreground text-xs">{warningCount}</Text>
                        </View>
                    ) : null}
                </View>

                <BudgetProgressBar percentage={overallPercentage} status={overallStatus} />

                <View className="flex-row justify-between">
                    <Text className="text-secondary-foreground text-sm">
                        {formatAmount(totalSpent)} / {formatAmount(budget.overallLimit)}
                    </Text>
                    <Text className={isOnPace ? 'text-positive-foreground text-sm' : 'text-destructive-foreground text-sm'}>
                        {isOnPace ? (
                            <Trans>On track</Trans>
                        ) : (
                            <Trans>{formatAmount(Math.abs(paceVariance))} over pace</Trans>
                        )}
                    </Text>
                </View>
            </Card>
        </Link>
    );
};
```

**Step 2: Commit**

```bash
git add packages/app/src/budget/components
git commit -m "feat(app): add BudgetWidget component"
```

---

## Part 6: App Package - Screens

### Task 24: Budget Detail Screen

**Files:**
- Create: `packages/app/src/app/(main)/budget/index.tsx`

**Step 1: Create screen**

```typescript
// packages/app/src/app/(main)/budget/index.tsx
/* jscpd:ignore-start */
import { Trans } from '@lingui/react/macro';
import { useLingui } from '@lingui/react';
import { isDefined } from '@rnw-community/shared';
import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { Card } from '../../../@generic/component/card/card';
import { Text } from '../../../@generic/component/text/text';
import { UserIconNameEnum } from '../../../@generic/enum/user-icon-name.enum';
import { useFormatAmount } from '../../../@generic/hook/use-format-amount.hook';
import { BudgetCategoryRow } from '../../../budget/components/budget-category-row/budget-category-row';
import { BudgetProgressBar } from '../../../budget/components/budget-progress-bar/budget-progress-bar';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useGetBudgetCalculationQuery } from '../../../budget/query/use-get-budget-calculation.query';

export default function BudgetDetailPage() {
    const { t } = useLingui();
    const { formatAmount } = useFormatAmount();

    const { budget } = useGetActiveBudgetQuery();
    const { calculation, isLoading } = useGetBudgetCalculationQuery(budget);

    if (!isDefined(calculation) || isLoading) {
        return (
            <Page>
                <PageHeader title={t`Budget`} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground"><Trans>Loading...</Trans></Text>
                </View>
            </Page>
        );
    }

    const sortedCategories = [...calculation.categoryStatuses].sort((a, b) => b.percentage - a.percentage);

    return (
        <Page>
            <PageHeader
                title={t`Budget`}
                rightAction={{
                    icon: UserIconNameEnum.Settings,
                    onPress: () => void 0
                }}
                rightActionHref="/budget/settings"
            />
            <ScrollView className="flex-1 px-xl" contentContainerClassName="gap-y-xl pb-xl">
                <Card className="p-xl gap-y-md">
                    <Text className="text-primary font-medium"><Trans>Overall Budget</Trans></Text>
                    <BudgetProgressBar
                        percentage={calculation.overallPercentage}
                        status={calculation.overallStatus}
                    />
                    <View className="flex-row justify-between">
                        <Text className="text-secondary-foreground">
                            {formatAmount(calculation.totalSpent)} / {formatAmount(calculation.budget.overallLimit)}
                        </Text>
                        <Text className="text-tertiary-foreground">
                            {Math.round(calculation.overallPercentage)}%
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-tertiary-foreground text-sm">
                            <Trans>Allocated: {formatAmount(calculation.allocatedAmount)}</Trans>
                        </Text>
                        <Text className="text-tertiary-foreground text-sm">
                            <Trans>Buffer: {formatAmount(calculation.unallocatedBuffer)}</Trans>
                        </Text>
                    </View>
                </Card>

                {calculation.incomeStatuses.length > 0 ? (
                    <Card className="p-xl gap-y-md">
                        <Text className="text-primary font-medium"><Trans>Expected Income</Trans></Text>
                        {calculation.incomeStatuses.map(income => (
                            <View key={income.categoryId} className="flex-row justify-between">
                                <Text className="text-secondary-foreground">{income.categoryName}</Text>
                                <Text className="text-secondary-foreground">
                                    {formatAmount(income.actual)} / {formatAmount(income.expected)}
                                </Text>
                            </View>
                        ))}
                        <View className="flex-row justify-between border-t border-border pt-sm">
                            <Text className="text-primary font-medium"><Trans>Total</Trans></Text>
                            <Text className={calculation.incomeVariance >= 0 ? 'text-positive-foreground' : 'text-destructive-foreground'}>
                                {calculation.incomeVariance >= 0 ? '+' : ''}{formatAmount(calculation.incomeVariance)}
                            </Text>
                        </View>
                    </Card>
                ) : null}

                <Card className="p-xl gap-y-lg">
                    <Text className="text-primary font-medium"><Trans>Category Budgets</Trans></Text>
                    {sortedCategories.map(categoryStatus => (
                        <BudgetCategoryRow
                            key={categoryStatus.category.id}
                            categoryStatus={categoryStatus}
                        />
                    ))}
                </Card>
            </ScrollView>
        </Page>
    );
}
/* jscpd:ignore-end */
```

**Step 2: Commit**

```bash
git add packages/app/src/app/\(main\)/budget
git commit -m "feat(app): add Budget detail screen"
```

---

### Task 25: Budget Settings Screen

**Files:**
- Create: `packages/app/src/app/(main)/budget/settings.tsx`

**Step 1: Create screen** (Similar pattern to detail, with edit forms)

**Step 2: Commit**

```bash
git add packages/app/src/app/\(main\)/budget
git commit -m "feat(app): add Budget settings screen"
```

---

### Task 26: Budget Setup Wizard - Period Step

**Files:**
- Create: `packages/app/src/app/(main)/budget/setup/index.tsx` (redirects to period)
- Create: `packages/app/src/app/(main)/budget/setup/period.tsx`

**Step 1: Create period step**

```typescript
// packages/app/src/app/(main)/budget/setup/period.tsx
/* jscpd:ignore-start */
import { Trans } from '@lingui/react/macro';
import { useLingui } from '@lingui/react';
import { BudgetPeriodEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '../../../../@generic/component/button/button';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { Text } from '../../../../@generic/component/text/text';
import { useBudgetSetupContext } from '../../../../budget/context/budget-setup.context';

export default function BudgetSetupPeriodPage() {
    const { t } = useLingui();
    const router = useRouter();
    const { form } = useBudgetSetupContext();

    const handleSelectPeriod = (period: BudgetPeriodEnum) => {
        form.setValue('period', period);
        router.push('/budget/setup/overall');
    };

    return (
        <Page>
            <PageHeader title={t`Budget Period`} />
            <View className="flex-1 px-xl gap-y-xl">
                <Text className="text-primary text-lg font-medium">
                    <Trans>How often do you want to reset your budget?</Trans>
                </Text>

                <Button
                    content={<Trans>Weekly</Trans>}
                    variant="ghost"
                    onPress={() => handleSelectPeriod(BudgetPeriodEnum.WEEKLY)}
                />
                <Button
                    content={<Trans>Bi-weekly</Trans>}
                    variant="ghost"
                    onPress={() => handleSelectPeriod(BudgetPeriodEnum.BI_WEEKLY)}
                />
                <Button
                    content={<Trans>Monthly</Trans>}
                    variant="ghost"
                    onPress={() => handleSelectPeriod(BudgetPeriodEnum.MONTHLY)}
                />
            </View>
        </Page>
    );
}
/* jscpd:ignore-end */
```

**Step 2: Continue with overall.tsx, income.tsx, categories.tsx, confirm.tsx**

**Step 3: Create BudgetSetupContext for wizard state**

**Step 4: Commit each step**

---

### Task 27: Integrate Widget into Home Screen

**Files:**
- Modify: Home screen file (find existing home/dashboard screen)

**Step 1: Import and add BudgetWidget**

**Step 2: Commit**

```bash
git add packages/app/src/app
git commit -m "feat(app): integrate BudgetWidget into home screen"
```

---

## Part 7: Final Steps

### Task 28: Run i18n Sync

**Step 1: Extract and compile translations**

```bash
yarn workspace @budgie-at/app i18n:sync
```

**Step 2: Commit**

```bash
git add packages/app/src/locales
git commit -m "chore(app): sync i18n translations for budget feature"
```

---

### Task 29: Validation

**Step 1: Run all validation commands**

```bash
yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd
```

**Step 2: Fix any issues that arise**

**Step 3: Commit fixes**

```bash
git add .
git commit -m "fix(app): address linting and type issues"
```

---

### Task 30: Final Review and Test

**Step 1: Start the app**

```bash
cd packages/app && yarn start
```

**Step 2: Test the complete flow**

- Open home screen → see widget with "Set up your budget"
- Tap widget → navigate to setup wizard
- Complete setup wizard
- See budget detail screen
- Edit settings
- Verify calculations are correct

**Step 3: Final commit**

```bash
git add .
git commit -m "feat(app): complete budget tracking Phase 1 implementation"
```

---

## Summary

**Total Tasks:** 30

**Entities Created:**
- Budget
- BudgetCategoryLimit
- BudgetIncomeExpectation
- AccountBudgetExclusion

**Services Created:**
- BudgetCalculationService
- BudgetService

**Components Created:**
- BudgetProgressBar
- BudgetCategoryRow
- BudgetWidget

**Screens Created:**
- Budget Detail (`/budget`)
- Budget Settings (`/budget/settings`)
- Budget Setup Wizard (`/budget/setup/*`)

**Estimated Commits:** ~20-25 atomic commits following TDD pattern
