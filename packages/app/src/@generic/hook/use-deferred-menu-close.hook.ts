import { useRef } from 'react';

import { EmptyFn, isDefined } from '@rnw-community/shared';

export const useDeferredMenuClose = (isOpen: boolean, setIsOpen: (isOpen: boolean) => void) => {
    const pendingActionRef = useRef<EmptyFn | null>(null);

    const closeMenu = (afterClose?: EmptyFn) => {
        if (!isOpen) {
            return;
        }

        pendingActionRef.current = afterClose ?? null;
        setIsOpen(false);
    };

    const runPendingAction = () => {
        if (isDefined(pendingActionRef.current)) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }
    };

    return { closeMenu, runPendingAction };
};
