import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { expoDb } from '../db/db';

const THROTTLE_MS = 5 * 60 * 1000;

export const usePragmaOptimize = () => {
    const lastRunAtRef = useRef<number>(0);

    useEffect(() => {
        const handleChange = (state: AppStateStatus) => {
            if (state !== 'background') {
                return;
            }
            const now = Date.now();
            if (now - lastRunAtRef.current < THROTTLE_MS) {
                return;
            }
            lastRunAtRef.current = now;
            expoDb.execSync('PRAGMA optimize;'); // eslint-disable-line lingui/no-unlocalized-strings
        };

        const subscription = AppState.addEventListener('change', handleChange);

        return () => subscription.remove();
    }, []);
};
