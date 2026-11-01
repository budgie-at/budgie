import { isDefined } from '@rnw-community/shared';

import type { BudgetProjectionKeyInterface } from '../interface/budget-projection-key.interface';
import type { BudgetProjectionSourceInterface } from '../interface/budget-projection-source.interface';

const toDate = (epochMs: number | null): Date | null => (isDefined(epochMs) ? new Date(epochMs) : null);

export const fromBudgetProjectionKey = (key: BudgetProjectionKeyInterface): BudgetProjectionSourceInterface => ({
    id: key.id,
    kind: key.kind,
    period: key.period,
    periodStartDay: key.periodStartDay,
    useLastDayOfMonth: key.useLastDayOfMonth,
    limitSource: key.limitSource,
    instrumentId: key.instrumentId,
    overallLimit: key.overallLimit,
    otherLimit: key.otherLimit,
    tagId: key.tagId,
    periodAnchorDate: toDate(key.periodAnchorMs),
    startsAt: toDate(key.startsAtMs),
    endsAt: toDate(key.endsAtMs)
});
