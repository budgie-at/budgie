import type { RecurringSeriesEntityInterface } from '@budgie/contracts';
export type StateSeriesType = Pick<
    RecurringSeriesEntityInterface,
    'source' | 'userState' | 'confidence' | 'deletedAt' | 'endsAt' | 'lastSeenAt' | 'cadenceUnit' | 'cadenceInterval'
>;
