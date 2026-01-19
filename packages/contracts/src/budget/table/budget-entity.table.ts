import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
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
