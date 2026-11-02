import { useLingui } from '@lingui/react/macro';
import { isToday } from 'date-fns/isToday';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';

export const useFormatSyncTime = () => {
    const { t } = useLingui();
    const { formatTime, formatWeekdayWithTime } = useFormatDate();

    return (date: Date) => {
        if (isToday(date)) {
            const time = formatTime(date);

            return t`Today ${time}`;
        }

        return formatWeekdayWithTime(date);
    };
};
