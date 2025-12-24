import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppState = (onChange?: (isActive: boolean) => Promise<void> | void) => {
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const subscription = AppState.addEventListener('change', async nextAppState => {
            if (appState.match(/inactive|background/iu) && nextAppState === 'active') {
                await onChange?.(true);
            } else if (appState === 'active' && nextAppState.match(/inactive|background/iu)) {
                await onChange?.(false);
            }

            setAppState(nextAppState);
        });

        return () => void subscription.remove();
    }, [appState, onChange]);

    return {
        appState,
        isActive: appState === 'active',
        isBackground: appState === 'background',
        isInactive: appState === 'inactive'
    };
};
