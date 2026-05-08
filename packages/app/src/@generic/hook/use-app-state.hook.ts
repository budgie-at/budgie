import { getLogger } from '@budgie/logger';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { getErrorMessage } from '@rnw-community/shared';

const logger = getLogger('useAppState');

export const useAppState = (onChange?: (isActive: boolean) => Promise<void> | void) => {
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
    const appStateRef = useRef(appState);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        appStateRef.current = appState;
        onChangeRef.current = onChange;
    }, [appState, onChange]);

    useEffect(() => {
        const handleChange = (isActive: boolean): void => {
            try {
                const result = onChangeRef.current?.(isActive);

                void Promise.resolve(result).catch((error: unknown) => {
                    logger.error('change:failed', { isActive, errorMessage: getErrorMessage(error) });
                });
            } catch (error) {
                logger.error('change:failed', { isActive, errorMessage: getErrorMessage(error) });
            }
        };

        const subscription = AppState.addEventListener('change', nextAppState => {
            const previousAppState = appStateRef.current;

            if (previousAppState.match(/inactive|background/iu) && nextAppState === 'active') {
                handleChange(true);
            } else if (previousAppState === 'active' && nextAppState.match(/inactive|background/iu)) {
                handleChange(false);
            }

            appStateRef.current = nextAppState;
            setAppState(nextAppState);
        });

        return () => void subscription.remove();
    }, []);

    return {
        appState,
        isActive: appState === 'active',
        isBackground: appState === 'background',
        isInactive: appState === 'inactive'
    };
};
