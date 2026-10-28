import { useEffect, useEffectEvent, useRef } from 'react';
import { AppState } from 'react-native';

import type { AppStateStatus } from 'react-native';

export const useAppState = (onChange: (isActive: boolean) => void) => {
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    const handleAppStateChange = useEffectEvent((nextAppState: AppStateStatus) => {
        const previousAppState = appStateRef.current;
        const movedToActive = previousAppState !== 'active' && nextAppState === 'active';
        const movedFromActive = previousAppState === 'active' && nextAppState !== 'active';

        appStateRef.current = nextAppState;

        if (movedToActive) {
            onChange(true);

            return;
        }

        if (movedFromActive) {
            onChange(false);
        }
    });

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => void subscription.remove();
    }, []);
};
