import { use, useEffect, useState } from 'react';

import { HostAccessibilityContext } from '../context/host-accessibility.context';

export const useAccessibilityLayer = () => {
    const { openCount, setOpenCount } = use(HostAccessibilityContext);
    const [ownDepth] = useState(openCount + 1);

    useEffect(() => {
        setOpenCount(count => count + 1);

        return () => {
            setOpenCount(count => count - 1);
        };
    }, [setOpenCount]);

    return openCount > ownDepth;
};
