import { useEffect, useEffectEvent, useRef } from 'react';
import { AppState } from 'react-native';

import type { AppStateStatus } from 'react-native';

export const useAppState = (onChange: (isActive: boolean) => void) => {
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    const handleAppStateChange = useEffectEvent((nextAppState: AppStateStatus) => {
        if (nextAppState === 'inactive' || nextAppState === appStateRef.current) {
            return;
        }

        appStateRef.current = nextAppState;
        onChange(nextAppState === 'active');
    });

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => void subscription.remove();
    }, []);
};
