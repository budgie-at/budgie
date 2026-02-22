import { useFocusEffect } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { useSettingsContext } from '../../settings/context/settings.context';
import { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import { recurringCalendarService } from '../service/recurring-calendar.service';

interface UseRecurringCalendarReturnInterface {
    readonly data: RecurringCalendarDataInterface | undefined;
    readonly isLoading: boolean;
    readonly error: string | undefined;
}

const EMPTY_ENTRIES_BY_DAY: ReadonlyMap<number, never[]> = new Map();

export const useRecurringCalendar = (): UseRecurringCalendarReturnInterface => {
    const { defaultInstrument } = useSettingsContext();
    const [data, setData] = useState<RecurringCalendarDataInterface | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();

    useFocusEffect(() => {
        let cancelled = false;

        const fetchData = async (): Promise<void> => {
            setIsLoading(true);

            try {
                const result = await recurringCalendarService.getMonthlyRecurringPayments(defaultInstrument.id);

                if (!cancelled) {
                    setData(result);
                }
            } catch (fetchError: unknown) {
                if (!cancelled) {
                    setError(getErrorMessage(fetchError));
                    setData({ entriesByDay: EMPTY_ENTRIES_BY_DAY, totalAmount: 0 });
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void fetchData();

        return () => {
            cancelled = true;
        };
    });

    return { data, isLoading, error };
};
