import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { AppStateStatus } from 'react-native';

export const useAppState = (onChange?: (isActive: boolean) => void) => {
    const currentAppState = AppState.currentState;
    const appStateRef = useRef<AppStateStatus>(currentAppState);
    const [appState, setAppState] = useState<AppStateStatus>(currentAppState);

    const handleAppStateChange = useEffectEvent((nextAppState: AppStateStatus) => {
        const previousAppState = appStateRef.current;
        const movedToActive = previousAppState !== 'active' && nextAppState === 'active';
        const movedFromActive = previousAppState === 'active' && nextAppState !== 'active';

        appStateRef.current = nextAppState;
        setAppState(nextAppState);

        if (movedToActive) {
            onChange?.(true);

            return;
        }

        if (movedFromActive) {
            onChange?.(false);
        }
    });

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => void subscription.remove();
    }, []);

    return {
        appState,
        isActive: appState === 'active',
        isBackground: appState === 'background',
        isInactive: appState === 'inactive'
    };
};
