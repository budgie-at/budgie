import {
    RecurringSeriesEntityTable,
    RecurringSeriesSourceEnum,
    RecurringSeriesTransactionEntityTable,
    RecurringSeriesUserStateEnum
} from '@budgie/contracts';
import { and, eq, gte, isNull, ne, or, sql } from 'drizzle-orm';

import { RECURRING_ACTIVE_CONFIDENCE } from '../constant/recurring-active-confidence.constant';

export const buildRecurringActiveCondition = () =>
    and(
        isNull(RecurringSeriesEntityTable.deletedAt),
        ne(RecurringSeriesEntityTable.userState, RecurringSeriesUserStateEnum.DISMISSED),
        or(
            eq(RecurringSeriesEntityTable.userState, RecurringSeriesUserStateEnum.CONFIRMED),
            eq(RecurringSeriesEntityTable.source, RecurringSeriesSourceEnum.MANUAL),
            and(
                gte(RecurringSeriesEntityTable.confidence, RECURRING_ACTIVE_CONFIDENCE),
                sql`EXISTS (SELECT 1 FROM ${RecurringSeriesTransactionEntityTable}
                    WHERE ${RecurringSeriesTransactionEntityTable.seriesId} = ${RecurringSeriesEntityTable.id}
                    AND ${RecurringSeriesTransactionEntityTable.deletedAt} IS NULL
                    AND ${RecurringSeriesTransactionEntityTable.isExcluded} = 0)`
            )
        )
    );
