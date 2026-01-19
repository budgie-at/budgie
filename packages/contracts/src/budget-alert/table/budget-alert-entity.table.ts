import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BudgetAlertSeverityEnum } from '../enum/budget-alert-severity.enum';
import { BudgetAlertTypeEnum } from '../enum/budget-alert-type.enum';

export const BudgetAlertEntityTable = sqliteTable(
    'budget_alerts',
    withBaseEntityTableColumns({
        budgetId: int('budget_id').notNull(),
        categoryId: int('category_id'),
        type: text('type', { enum: convertEnumToDrizzleEnum(BudgetAlertTypeEnum) })
            .$type<BudgetAlertTypeEnum>()
            .notNull(),
        severity: text('severity', { enum: convertEnumToDrizzleEnum(BudgetAlertSeverityEnum) })
            .$type<BudgetAlertSeverityEnum>()
            .notNull(),
        percentage: int('percentage').notNull(),
        amount: int('amount'),
        transactionId: int('transaction_id'),
        dismissedAt: int('dismissed_at', { mode: 'timestamp' }),
        periodStart: int('period_start', { mode: 'timestamp' }).notNull()
    })
);
