import { useFocusEffect } from 'expo-router';
import { useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { scheduleIdleCallback } from '../utils/schedule-idle-callback.util';

export const useFocusKey = (): number => {
    const [focusKey, setFocusKey] = useState(0);
    const isFirstFocus = useRef(true);

    useFocusEffect(() => {
        if (isFirstFocus.current) {
            isFirstFocus.current = false;

            return emptyFn;
        }

        const cancelIdleCallback = scheduleIdleCallback(() => {
            setFocusKey(prev => prev + 1);
        });

        return cancelIdleCallback;
    });

    return focusKey;
};
