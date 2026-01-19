import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BudgetPeriodEnum } from '../../budget/enum/budget-period.enum';

export const BudgetTemplateEntityTable = sqliteTable(
    'budget_templates',
    withBaseEntityTableColumns({
        name: text('name').notNull(),
        period: text('period', { enum: convertEnumToDrizzleEnum(BudgetPeriodEnum) })
            .$type<BudgetPeriodEnum>()
            .notNull(),
        periodStartDay: int('period_start_day').notNull().default(1),
        overallLimit: int('overall_limit').notNull(),
        rolloverEnabled: int('rollover_enabled', { mode: 'boolean' }).notNull().default(false),
        rolloverDeficitEnabled: int('rollover_deficit_enabled', { mode: 'boolean' }).notNull().default(false),
        categoryLimitsJson: text('category_limits_json'),
        incomeExpectationsJson: text('income_expectations_json')
    })
);
