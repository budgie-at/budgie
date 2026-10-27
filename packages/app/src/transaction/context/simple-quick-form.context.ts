import { createContext, use } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { SimpleQuickFormContextValueInterface } from '../interface/simple-quick-form-context-value.interface';

export const SimpleQuickFormContext = createContext<SimpleQuickFormContextValueInterface | null>(null);

export const useSimpleQuickForm = (): SimpleQuickFormContextValueInterface => {
    const context = use(SimpleQuickFormContext);

    if (!isDefined(context)) {
        throw new Error('useSimpleQuickFormCalledOutsideProvider');
    }

    return context;
};
