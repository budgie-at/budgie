import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppState = () => {
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', setAppState);

        return () => void subscription.remove();
    }, []);

    return {
        appState,
        isActive: appState === 'active',
        isBackground: appState === 'background',
        isInactive: appState === 'inactive'
    };
};
