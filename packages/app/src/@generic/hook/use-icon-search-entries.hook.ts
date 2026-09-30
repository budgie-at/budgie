import { useEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { appRuntime } from '../runtime/app.runtime';
import { iconSearchService } from '../service/icon-search.service';

export const useIconSearchEntries = () => {
    const [entries, setEntries] = useState(iconSearchService.entries);

    useEffect(() => {
        appRuntime.runPromise(iconSearchService.load()).then(setEntries).catch(emptyFn);
    }, []);

    return entries;
};
