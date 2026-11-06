import { isSameDay } from 'date-fns/isSameDay';
import { startOfDay } from 'date-fns/startOfDay';
import { useState } from 'react';

import { useAppState } from '../../@generic/hook/use-app-state.hook';

export const useRecurringNow = (): Date => {
    const [now, setNow] = useState(() => startOfDay(new Date()));

    useAppState(isActive => {
        if (isActive) {
            setNow(current => {
                const next = startOfDay(new Date());

                return isSameDay(current, next) ? current : next;
            });
        }
    });

    return now;
};
