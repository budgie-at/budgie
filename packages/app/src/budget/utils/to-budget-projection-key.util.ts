import { isDefined } from '@rnw-community/shared';

import type { BudgetProjectionKeyInterface } from '../interface/budget-projection-key.interface';
import type { BudgetProjectionSourceInterface } from '../interface/budget-projection-source.interface';

const toEpochMs = (date: Date | null): number | null => (isDefined(date) ? date.getTime() : null);

export const toBudgetProjectionKey = (budget: BudgetProjectionSourceInterface, dayStart: number): BudgetProjectionKeyInterface => ({
    id: budget.id,
    kind: budget.kind,
    period: budget.period,
    periodStartDay: budget.periodStartDay,
    useLastDayOfMonth: budget.useLastDayOfMonth,
    limitSource: budget.limitSource,
    instrumentId: budget.instrumentId,
    overallLimit: budget.overallLimit,
    otherLimit: budget.otherLimit,
    tagId: budget.tagId,
    periodAnchorMs: toEpochMs(budget.periodAnchorDate),
    startsAtMs: toEpochMs(budget.startsAt),
    endsAtMs: toEpochMs(budget.endsAt),
    dayStart
});
