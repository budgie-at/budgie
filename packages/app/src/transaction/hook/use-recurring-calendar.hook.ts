import { SettingsEntityTable } from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { isSameDay } from 'date-fns/isSameDay';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { useAppState } from '../../@generic/hook/use-app-state.hook';
import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { STATISTICS_TABLES } from '../constant/statistics-tables.constant';

import type { RecurringCalendarDataInterface } from '@budgie/recurring';

const recurringCalendarAtom = databaseQueryFamily(
    [...STATISTICS_TABLES, SettingsEntityTable],
    RecurringService,
    (recurringService, [year, month, nowTime]: readonly [number, number, number]) =>
        recurringService.calendar(year, month, new Date(nowTime))
);

export const useRecurringCalendar = (displayYear: number, displayMonth: number): { readonly data?: RecurringCalendarDataInterface } => {
    const [now, setNow] = useState(() => new Date());
    useAppState(isActive => {
        if (isActive) {
            setNow(current => {
                const next = new Date();

                return isSameDay(current, next) ? current : next;
            });
        }
    });

    const result = useLiveAtomValue(recurringCalendarAtom([displayYear, displayMonth, now.getTime()]));

    return { ...(AsyncResult.isSuccess(result) && { data: result.value }) };
};
