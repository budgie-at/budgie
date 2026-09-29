import { useEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { iconSearchService } from '../service/icon-search.service';

export const useIconSearchEntries = () => {
    const [entries, setEntries] = useState(iconSearchService.entries);

    useEffect(() => {
        iconSearchService.load().then(setEntries).catch(emptyFn);
    }, []);

    return entries;
};
