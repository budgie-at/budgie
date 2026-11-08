import { sql } from 'drizzle-orm';
import { int, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { getBudgetCategoryLimitColumns } from '../../budget-category-limit/utils/get-budget-category-limit-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { syncIdentityUniqueIndex } from '../../cloud-sync/utils/sync-identity-unique-index.util';
import { withSyncIdentityColumns } from '../../cloud-sync/utils/with-sync-identity-columns.util';

export const BudgetCategoryLimitEntityTable = sqliteTable(
    'budget_category_limits',
    withBaseEntityTableColumns({
        ...withSyncIdentityColumns(),
        budgetId: int('budget_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        ...getBudgetCategoryLimitColumns(),
        userEditedAt: int('user_edited_at', { mode: 'timestamp' })
    }),
    table => [
        syncIdentityUniqueIndex('budget_category_limits', table),
        uniqueIndex('budget_category_limit_budget_category_unq')
            .on(table.budgetId, table.categoryId)
            .where(sql`deleted_at IS NULL`)
    ]
);
