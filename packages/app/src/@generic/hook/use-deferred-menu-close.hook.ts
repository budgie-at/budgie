import { useLayoutEffect, useRef } from 'react';

import { EmptyFn, isDefined } from '@rnw-community/shared';

export const useDeferredMenuClose = (isOpen: boolean, setIsOpen: (isOpen: boolean) => void) => {
    const pendingActionRef = useRef<EmptyFn | null>(null);
    const isClosingRef = useRef(false);

    useLayoutEffect(() => {
        if (isOpen) {
            isClosingRef.current = false;
        }
    }, [isOpen]);

    const closeMenu = (afterClose?: EmptyFn) => {
        if (!isOpen || isClosingRef.current) {
            return;
        }

        isClosingRef.current = true;
        pendingActionRef.current = afterClose ?? null;
        setIsOpen(false);
    };

    const runPendingAction = () => {
        isClosingRef.current = false;

        if (isDefined(pendingActionRef.current)) {
            const action = pendingActionRef.current;
            pendingActionRef.current = null;
            action();
        }
    };

    return { closeMenu, runPendingAction };
};
