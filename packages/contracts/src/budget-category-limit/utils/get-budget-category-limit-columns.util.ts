import { int, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { BudgetRolloverModeEnum } from '../../budget/enum/budget-rollover-mode.enum';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

export const getBudgetCategoryLimitColumns = () => ({
    categoryId: int('category_id', { mode: 'number' })
        .notNull()
        .references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
    limitAmount: int('limit_amount').notNull(),
    rolloverMode: text('rollover_mode', { enum: convertEnumToDrizzleEnum(BudgetRolloverModeEnum) })
        .$type<BudgetRolloverModeEnum>()
        .notNull()
        .default(BudgetRolloverModeEnum.NONE)
});
