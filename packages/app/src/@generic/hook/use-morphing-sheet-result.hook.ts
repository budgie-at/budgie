import { router } from 'expo-router';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

export const useMorphingSheetResult = <TResult>(resolve: (result: TResult) => void) => {
    const resolveCommittedRef = useRef<(() => void) | null>(null);

    const handleCommit = (result: TResult) => {
        if (isDefined(resolveCommittedRef.current)) {
            return;
        }

        resolveCommittedRef.current = () => {
            resolve(result);
        };
    };

    const handleDismissed = () => {
        if (isDefined(resolveCommittedRef.current)) {
            resolveCommittedRef.current();

            return;
        }

        router.back();
    };

    return { handleCommit, handleDismissed };
};
