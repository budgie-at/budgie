import { useEffect, useRef, useState } from 'react';

import { useFocusKey } from '../../@generic/hook/use-focus-key.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data-interface.type';
import { recurringCalendarService } from '../service/recurring-calendar.service';

interface UseRecurringCalendarReturnInterface {
    readonly data: RecurringCalendarDataInterface | undefined;
    readonly isLoading: boolean;
}

const EMPTY_ENTRIES_BY_DAY: ReadonlyMap<number, never[]> = new Map();

export const useRecurringCalendar = (displayYear: number, displayMonth: number): UseRecurringCalendarReturnInterface => {
    const { defaultInstrument } = useSettingsContext();
    const focusKey = useFocusKey();
    const [data, setData] = useState<RecurringCalendarDataInterface | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        if (!hasLoadedRef.current) {
            setIsLoading(true);
        }

        const fetchData = async (): Promise<void> => {
            try {
                const result = await recurringCalendarService.getMonthlyRecurringPayments(defaultInstrument.id, displayYear, displayMonth);

                if (!cancelled) {
                    hasLoadedRef.current = true;
                    setData(result);
                }
            } catch {
                if (!cancelled) {
                    const emptyData = {
                        entriesByDay: EMPTY_ENTRIES_BY_DAY,
                        forecastedEntriesByDay: EMPTY_ENTRIES_BY_DAY,
                        totalAmount: 0,
                        forecastedTotalAmount: 0
                    };
                    hasLoadedRef.current = true;
                    setData(emptyData);
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
    }, [focusKey, defaultInstrument.id, displayYear, displayMonth]);

    return { data, isLoading };
};
