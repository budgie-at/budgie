import { useState } from 'react';

export const usePopoverForceClose = (isOpen: boolean) => {
    const [isForceClosed, setIsForceClosed] = useState(false);

    if (isOpen && isForceClosed) {
        setIsForceClosed(false);
    }

    const forceClose = () => {
        setIsForceClosed(true);
    };

    return { isForceClosed, forceClose };
};
