import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { CollapsibleChromeSearchInterface } from '../interface/collapsible-chrome-search.interface';

export const CollapsibleChromeSearchContext = createContext<CollapsibleChromeSearchInterface>({
    isSearchActive: false,
    setSearchActive: emptyFn
});

export const useCollapsibleChromeSearch = () => use(CollapsibleChromeSearchContext);
