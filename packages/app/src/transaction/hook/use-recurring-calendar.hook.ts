import { LanguageEnum, TransactionPatternRepository } from '@budgie/contracts';
import { isSameDay } from 'date-fns/isSameDay';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { useAppState } from '../../@generic/hook/use-app-state.hook';
import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { STATISTICS_TABLES } from '../constant/statistics-tables.constant';
import { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import { detectRecurringSeries } from '../utils/detect-recurring-series.util';
import { projectRecurringMonth } from '../utils/project-recurring-month.util';

const RECURRING_WINDOW_MONTHS = 24;

const recurringChargeCandidatesAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    TransactionPatternRepository,
    (transactionPatternRepository, [defaultInstrumentId, language, sinceTime]: readonly [number, LanguageEnum, number]) =>
        transactionPatternRepository.findRecurringChargeCandidates({ defaultInstrumentId, language, since: new Date(sinceTime) })
);

interface UseRecurringCalendarReturnInterface {
    readonly data?: RecurringCalendarDataInterface;
}

export const useRecurringCalendar = (displayYear: number, displayMonth: number): UseRecurringCalendarReturnInterface => {
    const { defaultInstrument } = useSettingsContext();
    const language = useSetting('language');
    const [now, setNow] = useState(() => new Date());
    useAppState(isActive => {
        if (isActive) {
            setNow(current => {
                const next = new Date();

                return isSameDay(current, next) ? current : next;
            });
        }
    });
    const since = new Date(now.getFullYear(), now.getMonth() - RECURRING_WINDOW_MONTHS, now.getDate());

    const result = useLiveAtomValue(recurringChargeCandidatesAtom([defaultInstrument.id, language, since.getTime()]));

    const calendarData = projectRecurringMonth(
        detectRecurringSeries(AsyncResult.getOrElse(result, () => [])),
        displayYear,
        displayMonth,
        now
    );

    return { ...(!AsyncResult.isInitial(result) && { data: calendarData }) };
};
