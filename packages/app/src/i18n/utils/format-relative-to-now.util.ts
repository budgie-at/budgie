import { secondsInDay, secondsInHour, secondsInMinute } from 'date-fns/constants';

import type { IntlShape } from '@formatjs/intl';

export const formatRelativeToNow = (date: Date, now: number, intl: Pick<IntlShape, 'formatRelativeTime'>) => {
    const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
    if (seconds < secondsInMinute) {
        return intl.formatRelativeTime(0, 'second', { numeric: 'auto' });
    }
    if (seconds < secondsInHour) {
        return intl.formatRelativeTime(-Math.floor(seconds / secondsInMinute), 'minute', { numeric: 'auto' });
    }
    if (seconds < secondsInDay) {
        return intl.formatRelativeTime(-Math.floor(seconds / secondsInHour), 'hour', { numeric: 'auto' });
    }

    return intl.formatRelativeTime(-Math.floor(seconds / secondsInDay), 'day', { numeric: 'auto' });
};
