import type { RecurringSeriesFormValues } from '../constant/recurring-series-form-schema.constant';
export type ScheduleFormValues = Pick<
    RecurringSeriesFormValues,
    'repeat' | 'customInterval' | 'customUnit' | 'anchorDate' | 'endMode' | 'endsOn' | 'endsAfterCount'
>;
