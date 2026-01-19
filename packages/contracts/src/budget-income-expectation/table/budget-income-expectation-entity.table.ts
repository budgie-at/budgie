import { int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

/* jscpd:ignore-start */
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
/* jscpd:ignore-end */
