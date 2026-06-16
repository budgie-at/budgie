import { sql } from 'drizzle-orm';
import { int, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

export const BudgetCategoryLimitEntityTable = sqliteTable(
    'budget_category_limits',
    withBaseEntityTableColumns({
        budgetId: int('budget_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        categoryId: int('category_id', { mode: 'number' })
            .notNull()
            .references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        limitAmount: int('limit_amount').notNull()
    }),
    table => [
        uniqueIndex('budget_category_limit_budget_category_unq')
            .on(table.budgetId, table.categoryId)
            .where(sql`deleted_at IS NULL`)
    ]
);
