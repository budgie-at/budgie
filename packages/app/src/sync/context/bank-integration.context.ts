import { ExternalSourceEnum } from '@budgie/contracts';
import { createContext, use } from 'react';

import type { BankIntegrationContextValueInterface } from '../interface/bank-integration-context-value.interface';

export const BankIntegrationContext = createContext<BankIntegrationContextValueInterface>({
    integration: {
        id: 0,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        deletedAt: null,
        provider: ExternalSourceEnum.MANUAL,
        token: '',
        label: null
    },
    capabilities: {
        supportsLiveSync: false,
        supportsFileImport: false,
        supportsAccountDiscovery: false,
        supportsDeposit: false
    }
});

export const useBankIntegration = () => use(BankIntegrationContext);
