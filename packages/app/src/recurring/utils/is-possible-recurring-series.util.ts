import { RecurringSeriesSourceEnum, RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { RECURRING_ACTIVE_CONFIDENCE } from '@budgie/recurring';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

export const isPossibleRecurringSeries = (series: Pick<RecurringSeriesListItemInterface, 'source' | 'userState' | 'confidence'>): boolean =>
    series.source === RecurringSeriesSourceEnum.DETECTED &&
    series.userState === RecurringSeriesUserStateEnum.SUGGESTED &&
    series.confidence < RECURRING_ACTIVE_CONFIDENCE;
