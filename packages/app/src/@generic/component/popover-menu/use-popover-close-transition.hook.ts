import { useState } from 'react';

import { usePopoverForceClose } from './use-popover-force-close.hook';

export const usePopoverCloseTransition = (isOpen: boolean) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [previousIsOpen, setPreviousIsOpen] = useState(isOpen);
    const { isForceClosed, forceClose: markForceClosed } = usePopoverForceClose(isOpen);

    if (isOpen !== previousIsOpen) {
        setPreviousIsOpen(isOpen);
        setIsAnimatingOut(!isOpen && !isForceClosed);
    }

    const forceClose = () => {
        markForceClosed();
        setIsAnimatingOut(false);
    };

    return { isAnimatingOut, setIsAnimatingOut, forceClose };
};
