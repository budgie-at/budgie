import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

export type RecurringManualInputInterface = Pick<
    RecurringSeriesEntityInterface,
    'kind' | 'title' | 'amount' | 'cadenceUnit' | 'cadenceInterval' | 'anchorDate'
> &
    Partial<Pick<RecurringSeriesEntityInterface, 'categoryId' | 'accountId' | 'endsAt' | 'reminderDaysBefore'>> & {
        readonly instrumentId: number;
    };
