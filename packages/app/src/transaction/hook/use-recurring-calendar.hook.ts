import { isDefined } from '@rnw-community/shared';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import { detectRecurringSeries } from '../utils/detect-recurring-series.util';
import { projectRecurringMonth } from '../utils/project-recurring-month.util';

const RECURRING_WINDOW_MONTHS = 24;

interface UseRecurringCalendarReturnInterface {
    readonly data?: RecurringCalendarDataInterface;
    readonly isLoading: boolean;
}

export const useRecurringCalendar = (displayYear: number, displayMonth: number): UseRecurringCalendarReturnInterface => {
    const { defaultInstrument } = useSettingsContext();
    const language = useSetting('language');
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth() - RECURRING_WINDOW_MONTHS, now.getDate());

    const { data: candidates, updatedAt } = useDatabaseLiveQuery(
        transactionPatternRepository.findRecurringChargeCandidates({
            defaultInstrumentId: defaultInstrument.id,
            language,
            since
        }),
        [defaultInstrument.id, language, since.getTime()]
    );

    const calendarData = projectRecurringMonth(detectRecurringSeries(candidates), displayYear, displayMonth, now);
    const isLoading = !isDefined(updatedAt);

    return { ...(isDefined(updatedAt) && { data: calendarData }), isLoading };
};
