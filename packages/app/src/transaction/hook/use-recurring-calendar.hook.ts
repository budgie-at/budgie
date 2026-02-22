import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

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

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            recurringCalendarService.getMonthlyRecurringPayments().then(
                result => {
                    setData(result);
                    setError(undefined);
                    setIsLoading(false);
                },
                (fetchError: unknown) => {
                    setError(getErrorMessage(fetchError));
                    setData({ entriesByDay: EMPTY_ENTRIES_BY_DAY, totalAmount: 0 });
                    setIsLoading(false);
                }
            );
        }, [])
    );

    return { data, isLoading, error };
};
