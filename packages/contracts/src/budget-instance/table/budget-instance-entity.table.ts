import { int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { BudgetInstanceStatusEnum } from '../enum/budget-instance-status.enum';

export const BudgetInstanceEntityTable = sqliteTable(
    'budget_instances',
    withBaseEntityTableColumns({
        budgetId: int('budget_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        status: text('status', { enum: convertEnumToDrizzleEnum(BudgetInstanceStatusEnum) })
            .$type<BudgetInstanceStatusEnum>()
            .notNull()
            .default(BudgetInstanceStatusEnum.OPEN),
        startDate: int('start_date', { mode: 'timestamp' }).notNull(),
        endDate: int('end_date', { mode: 'timestamp' }).notNull(),
        totalPlanned: int('total_planned', { mode: 'number' }).notNull().default(0),
        totalActual: int('total_actual', { mode: 'number' }).notNull().default(0),
        totalForecast: int('total_forecast', { mode: 'number' }).notNull().default(0),
        exchangeRate: real('exchange_rate').notNull().default(1),
        incomeActual: int('income_actual', { mode: 'number' }).notNull().default(0)
    })
);

