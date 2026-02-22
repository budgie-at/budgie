import { useFocusEffect } from 'expo-router';
import { useEffect, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import { recurringCalendarService } from '../service/recurring-calendar.service';

interface UseRecurringCalendarReturnInterface {
    readonly data: RecurringCalendarDataInterface | undefined;
    readonly isLoading: boolean;
    readonly error: string | undefined;
}

const EMPTY_ENTRIES_BY_DAY: ReadonlyMap<number, never[]> = new Map();

export const useRecurringCalendar = (): UseRecurringCalendarReturnInterface => {
    const [data, setData] = useState<RecurringCalendarDataInterface | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    const [refreshVersion, setRefreshVersion] = useState(0);

    useFocusEffect(() => {
        setRefreshVersion(version => version + 1);
    });

    useEffect(() => {
        let cancelled = false;

        const fetchData = async (): Promise<void> => {
            setIsLoading(true);

            try {
                const result = await recurringCalendarService.getMonthlyRecurringPayments();

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
    }, [refreshVersion]);

    return { data, isLoading, error };
};
