import { RecurringSeriesEntityTable, RecurringSeriesSourceEnum, RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { and, eq, gte, isNull, ne, or } from 'drizzle-orm';

import { RECURRING_ACTIVE_CONFIDENCE } from '../constant/recurring-active-confidence.constant';

export const buildRecurringActiveCondition = () =>
    and(
        isNull(RecurringSeriesEntityTable.deletedAt),
        ne(RecurringSeriesEntityTable.userState, RecurringSeriesUserStateEnum.DISMISSED),
        or(
            eq(RecurringSeriesEntityTable.userState, RecurringSeriesUserStateEnum.CONFIRMED),
            eq(RecurringSeriesEntityTable.source, RecurringSeriesSourceEnum.MANUAL),
            gte(RecurringSeriesEntityTable.confidence, RECURRING_ACTIVE_CONFIDENCE)
        )
    );
