import { useEffect, useRef } from 'react';

import type { EmptyFn } from '@rnw-community/shared';

export const usePopoverCloseCompleteEffect = (isRendered: boolean, onCloseComplete?: EmptyFn) => {
    const wasRenderedRef = useRef(isRendered);
    const onCloseCompleteRef = useRef(onCloseComplete);

    useEffect(() => {
        onCloseCompleteRef.current = onCloseComplete;
    });

    useEffect(() => {
        if (wasRenderedRef.current && !isRendered) {
            onCloseCompleteRef.current?.();
        }

        wasRenderedRef.current = isRendered;
    }, [isRendered]);
};
