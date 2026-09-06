import { createContext, use } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { BankIntegrationContextValueInterface } from '../interface/bank-integration-context-value.interface';

export const BankIntegrationContext = createContext<BankIntegrationContextValueInterface | null>(null);

export const useBankIntegration = (): BankIntegrationContextValueInterface => {
    const context = use(BankIntegrationContext);

    if (!isDefined(context)) {
        throw new Error('useBankIntegrationCalledOutsideProvider');
    }

    return context;
};
