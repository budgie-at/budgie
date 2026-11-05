import { isSameDay } from 'date-fns/isSameDay';
import { useState } from 'react';

import { useAppState } from '../../@generic/hook/use-app-state.hook';

export const useRecurringNow = (): Date => {
    const [now, setNow] = useState(() => new Date());

    useAppState(isActive => {
        if (isActive) {
            setNow(current => {
                const next = new Date();

                return isSameDay(current, next) ? current : next;
            });
        }
    });

    return now;
};
