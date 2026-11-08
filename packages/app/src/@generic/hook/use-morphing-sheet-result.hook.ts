import { router } from 'expo-router';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

export const useMorphingSheetResult = <TResult>(resolve: (result: TResult) => void) => {
    const pendingResultRef = useRef<TResult | null>(null);

    const handleCommit = (result: TResult) => {
        pendingResultRef.current = result;
    };

    const handleDismissed = () => {
        if (isDefined(pendingResultRef.current)) {
            resolve(pendingResultRef.current);

            return;
        }

        router.back();
    };

    return { handleCommit, handleDismissed };
};
