import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { isDefined } from '@rnw-community/shared';

const DEFAULT_STALE_THRESHOLD_MS = 30_000;

export const useForegroundRecovery = (onStaleReturn: () => void, staleThresholdMs = DEFAULT_STALE_THRESHOLD_MS): void => {
    const backgroundTimestampRef = useRef<number | null>(null);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'background') {
                backgroundTimestampRef.current = Date.now();
            } else if (state === 'active' && isDefined(backgroundTimestampRef.current)) {
                const backgroundDuration = Date.now() - backgroundTimestampRef.current;
                backgroundTimestampRef.current = null;

                if (backgroundDuration > staleThresholdMs) {
                    onStaleReturn();
                }
            }
        });

        return () => void subscription.remove();
    }, [onStaleReturn, staleThresholdMs]);
};
