import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { BudgetKindEnum } from '../enum/budget-kind.enum';
import { BudgetLimitSourceEnum } from '../enum/budget-limit-source.enum';
import { BudgetPeriodEnum } from '../enum/budget-period.enum';
import { BudgetRolloverModeEnum } from '../enum/budget-rollover-mode.enum';

export const BudgetEntityTable = sqliteTable(
    'budgets',
    withBaseEntityTableColumns({
        name: text('name').notNull(),
        kind: text('kind', { enum: convertEnumToDrizzleEnum(BudgetKindEnum) })
            .$type<BudgetKindEnum>()
            .notNull()
            .default(BudgetKindEnum.MAIN),
        period: text('period', { enum: convertEnumToDrizzleEnum(BudgetPeriodEnum) })
            .$type<BudgetPeriodEnum>()
            .notNull(),
        periodStartDay: int('period_start_day').notNull(),
        useLastDayOfMonth: int('use_last_day_of_month', { mode: 'boolean' }).notNull(),
        periodAnchorDate: int('period_anchor_date', { mode: 'timestamp' }),
        overallLimit: int('overall_limit').notNull(),
        otherLimit: int('other_limit').notNull(),
        otherLimitUserEditedAt: int('other_limit_user_edited_at', { mode: 'timestamp' }),
        limitSource: text('limit_source', { enum: convertEnumToDrizzleEnum(BudgetLimitSourceEnum) })
            .$type<BudgetLimitSourceEnum>()
            .notNull()
            .default(BudgetLimitSourceEnum.FIXED),
        isAutoTuneEnabled: int('is_auto_tune_enabled', { mode: 'boolean' }).notNull().default(true),
        otherRolloverMode: text('other_rollover_mode', { enum: convertEnumToDrizzleEnum(BudgetRolloverModeEnum) })
            .$type<BudgetRolloverModeEnum>()
            .notNull()
            .default(BudgetRolloverModeEnum.NONE),
        tagId: int('tag_id', { mode: 'number' }).references(() => TagEntityTable.id, { onDelete: 'set null' }),
        startsAt: int('starts_at', { mode: 'timestamp' }),
        endsAt: int('ends_at', { mode: 'timestamp' }),
        instrumentId: int('instrument_id')
            .notNull()
            .references(() => InstrumentEntityTable.id)
    })
);
