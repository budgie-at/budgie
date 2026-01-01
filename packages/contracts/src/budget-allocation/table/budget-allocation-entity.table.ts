import { int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetAllocationTypeEnum } from '../enum/budget-allocation-type.enum';
import { BudgetRolloverRuleEnum } from '../enum/budget-rollover-rule.enum';

export const BudgetAllocationEntityTable = sqliteTable(
    'budget_allocations',
    withBaseEntityTableColumns({
        budgetId: int('budget_id', { mode: 'number' })
            .notNull()
            .references(() => BudgetEntityTable.id, { onDelete: 'cascade' }),
        categoryId: int('category_id', { mode: 'number' })
            .references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        allocationType: text('allocation_type', { enum: convertEnumToDrizzleEnum(BudgetAllocationTypeEnum) })
            .$type<BudgetAllocationTypeEnum>()
            .notNull()
            .default(BudgetAllocationTypeEnum.FIXED),
        amount: int('amount', { mode: 'number' }).notNull().default(0),
        percentage: real('percentage').notNull().default(0),
        rolloverRule: text('rollover_rule', { enum: convertEnumToDrizzleEnum(BudgetRolloverRuleEnum) })
            .$type<BudgetRolloverRuleEnum>()
            .notNull()
            .default(BudgetRolloverRuleEnum.NONE),
        rolloverCap: int('rollover_cap', { mode: 'number' }),
        isSinkingFund: int('is_sinking_fund', { mode: 'boolean' }).notNull().default(false),
        sinkingFundTarget: int('sinking_fund_target', { mode: 'number' }),
        sinkingFundTargetDate: int('sinking_fund_target_date', { mode: 'timestamp' }),
        isExcluded: int('is_excluded', { mode: 'boolean' }).notNull().default(false)
    })
);

