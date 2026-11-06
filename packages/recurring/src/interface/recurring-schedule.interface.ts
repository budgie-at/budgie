import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

export type RecurringScheduleInterface = Pick<RecurringSeriesEntityInterface, 'cadenceUnit' | 'cadenceInterval' | 'anchorDate' | 'endsAt'>;
