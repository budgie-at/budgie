import { useFocusEffect } from 'expo-router';
import { useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

export const useFocusKey = (): number => {
    const [focusKey, setFocusKey] = useState(0);
    const isFirstFocus = useRef(true);

    useFocusEffect(() => {
        if (isFirstFocus.current) {
            isFirstFocus.current = false;

            return emptyFn;
        }

        const task = InteractionManager.runAfterInteractions(() => {
            setFocusKey(prev => prev + 1);
        });

        return () => void task.cancel();
    });

    return focusKey;
};
