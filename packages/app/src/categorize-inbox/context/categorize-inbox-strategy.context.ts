import { createContext, use } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';

export const CategorizeInboxStrategyContext = createContext<CategorizeInboxStrategyInterface | null>(null);

export const useCategorizeInboxStrategy = (): CategorizeInboxStrategyInterface => {
    const strategy = use(CategorizeInboxStrategyContext);

    if (!isDefined(strategy)) {
        throw new Error('useCategorizeInboxStrategyCalledOutsideProvider');
    }

    return strategy;
};
