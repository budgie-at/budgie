import { int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BudgetAllocationEntityTable } from '../../budget-allocation/table/budget-allocation-entity.table';
import { BudgetInstanceEntityTable } from '../../budget-instance/table/budget-instance-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

export const BudgetAllocationInstanceEntityTable = sqliteTable(
    'budget_allocation_instances',
    withBaseEntityTableColumns({
        budgetInstanceId: int('budget_instance_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetInstanceEntityTable.id, { onDelete: 'cascade' }),
        budgetAllocationId: int('budget_allocation_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetAllocationEntityTable.id, { onDelete: 'cascade' }),
        categoryId: int('category_id', { mode: 'number' })
            .references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        planned: int('planned', { mode: 'number' }).notNull().default(0),
        actual: int('actual', { mode: 'number' }).notNull().default(0),
        forecast: int('forecast', { mode: 'number' }).notNull().default(0),
        rolloverIn: int('rollover_in', { mode: 'number' }).notNull().default(0),
        rolloverOut: int('rollover_out', { mode: 'number' }).notNull().default(0),
        adjustment: int('adjustment', { mode: 'number' }).notNull().default(0)
    })
);

