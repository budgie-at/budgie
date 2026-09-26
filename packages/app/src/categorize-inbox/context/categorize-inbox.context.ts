import { createContext, use } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { CategorizeInboxContextValueInterface } from '../interface/categorize-inbox-context-value.interface';

export const CategorizeInboxContext = createContext<CategorizeInboxContextValueInterface | null>(null);

export const useCategorizeInboxContext = (): CategorizeInboxContextValueInterface => {
    const context = use(CategorizeInboxContext);

    if (!isDefined(context)) {
        throw new Error('useCategorizeInboxContextCalledOutsideProvider');
    }

    return context;
};
