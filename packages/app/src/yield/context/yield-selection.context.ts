import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { YieldSelectionContextInterface } from '../interface/yield-selection-context.interface';

export const YieldSelectionContext = createContext<YieldSelectionContextInterface>({
    selectedIndex: null,
    selectIndex: emptyFn,
    cancelScrub: emptyFn
});
