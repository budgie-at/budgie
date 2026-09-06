import { createContext, use } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { DebtAccountCardContextValueInterface } from '../interface/debt-account-card-context-value.interface';

export const DebtAccountCardContext = createContext<DebtAccountCardContextValueInterface | null>(null);

export const useDebtAccountCard = (): DebtAccountCardContextValueInterface => {
    const context = use(DebtAccountCardContext);

    if (!isDefined(context)) {
        throw new Error('useDebtAccountCardCalledOutsideProvider');
    }

    return context;
};
