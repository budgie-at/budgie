import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetLimitChangeReasonEnum } from '../enum/budget-limit-change-reason.enum';

export const BudgetLimitChangeEntityTable = sqliteTable(
    'budget_limit_changes',
    withBaseEntityTableColumns({
        budgetId: int('budget_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        categoryId: int('category_id', { mode: 'number' }).references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        previousAmount: int('previous_amount').notNull(),
        newAmount: int('new_amount').notNull(),
        reason: text('reason', { enum: convertEnumToDrizzleEnum(BudgetLimitChangeReasonEnum) })
            .$type<BudgetLimitChangeReasonEnum>()
            .notNull(),
        periodsObserved: int('periods_observed').notNull(),
        periodStart: int('period_start', { mode: 'timestamp' }).notNull()
    })
);
