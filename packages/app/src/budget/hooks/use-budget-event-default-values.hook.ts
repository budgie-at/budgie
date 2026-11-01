import { addDays } from 'date-fns/addDays';
import { startOfDay } from 'date-fns/startOfDay';

import { useToday } from '../../@generic/hook/use-today.hook';

import type { BudgetEventFormValues } from '../constant/budget-event-form-schema.constant';

const EVENT_DEFAULT_LENGTH_DAYS = 13;

export const useBudgetEventDefaultValues = (defaultInstrumentId: number): BudgetEventFormValues => {
    const startOfToday = startOfDay(useToday());

    return {
        name: '',
        tagId: 0,
        startsAtMs: startOfToday.getTime(),
        endsAtMs: addDays(startOfToday, EVENT_DEFAULT_LENGTH_DAYS).getTime(),
        overallLimit: 0,
        categoryLimits: [],
        instrumentId: defaultInstrumentId
    };
};
