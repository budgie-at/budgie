import { useState } from 'react';

import { EmptyFn, isDefined } from '@rnw-community/shared';

interface DeferredAction {
    readonly execute: EmptyFn;
}

interface ExternalMenuStateParams {
    readonly isOpen: boolean;
    readonly onClose: EmptyFn;
}

interface UseDeferredMenuCloseReturn {
    readonly isMenuOpen: boolean;
    readonly closeMenu: (afterClose?: EmptyFn) => void;
    readonly handleCloseComplete: EmptyFn;
    readonly openMenu: EmptyFn;
}

export const useDeferredMenuClose = (externalState?: ExternalMenuStateParams): UseDeferredMenuCloseReturn => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [deferredAction, setDeferredAction] = useState<DeferredAction | null>(null);

    const openMenu = () => {
        setIsMenuOpen(true);
    };

    const closeMenu = (afterClose?: EmptyFn) => {
        setDeferredAction(isDefined(afterClose) ? { execute: afterClose } : null);

        if (isDefined(externalState)) {
            externalState.onClose();
        } else {
            setIsMenuOpen(false);
        }
    };

    const handleCloseComplete = () => {
        if (isDefined(deferredAction)) {
            deferredAction.execute();
            setDeferredAction(null);
        }
    };

    return { isMenuOpen, closeMenu, handleCloseComplete, openMenu };
};
