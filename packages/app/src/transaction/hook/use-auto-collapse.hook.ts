import { useEffect } from 'react';

import { EmptyFn } from '@rnw-community/shared';

export const useAutoCollapse = (isExpanded: boolean, onCollapse: EmptyFn, delayMs: number): void => {
    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        const timeoutId = setTimeout(onCollapse, delayMs);

        // eslint-disable-next-line consistent-return -- cleanup only registered when timer started
        return () => void clearTimeout(timeoutId);
    }, [isExpanded, onCollapse, delayMs]);
};
