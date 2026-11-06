import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';

const RELATIVE_DAYS_LIMIT = 13;

export const useRecurringDueLabel = () => {
    const { t } = useLingui();

    return (date: Date, now: Date): string | null => {
        const days = differenceInCalendarDays(date, now);

        if (days < 0) {
            return t`Overdue`;
        }

        if (days === 0) {
            return t`Today`;
        }

        if (days === 1) {
            return t`Tomorrow`;
        }

        return days <= RELATIVE_DAYS_LIMIT ? t({ message: plural(days, { one: 'In # day', other: 'In # days' }) }) : null;
    };
};
