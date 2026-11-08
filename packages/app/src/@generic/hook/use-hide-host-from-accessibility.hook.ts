import { use, useEffect } from 'react';

import { HostAccessibilityContext } from '../context/host-accessibility.context';

export const useHideHostFromAccessibility = () => {
    const setOverlayCount = use(HostAccessibilityContext);

    useEffect(() => {
        setOverlayCount(count => count + 1);

        return () => {
            setOverlayCount(count => count - 1);
        };
    }, [setOverlayCount]);
};
