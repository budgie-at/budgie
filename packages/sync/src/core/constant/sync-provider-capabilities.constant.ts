import { ExternalSourceEnum } from '@budgie/contracts';

import type { SyncProviderCapabilitiesInterface } from '../interface/sync-provider-capabilities.interface';

const NO_SYNC_SERVICE = { supportsTokenAuth: false, supportsFileImport: false };

export const SYNC_PROVIDER_CAPABILITIES: Record<ExternalSourceEnum, SyncProviderCapabilitiesInterface> = {
    [ExternalSourceEnum.MANUAL]: { ...NO_SYNC_SERVICE, supportsDeposit: false },
    [ExternalSourceEnum.APPLE_PAY_AUTOMATION]: { ...NO_SYNC_SERVICE, supportsDeposit: false },
    [ExternalSourceEnum.MONOBANK]: { supportsTokenAuth: true, supportsFileImport: false, supportsDeposit: true },
    [ExternalSourceEnum.PRIVATBANK]: {
        supportsTokenAuth: false,
        supportsFileImport: true,
        supportsDeposit: true
    },
    [ExternalSourceEnum.ERSTE]: { supportsTokenAuth: false, supportsFileImport: true, supportsDeposit: true },
    [ExternalSourceEnum.REVOLUT]: { ...NO_SYNC_SERVICE, supportsDeposit: true },
    [ExternalSourceEnum.WISE]: { ...NO_SYNC_SERVICE, supportsDeposit: true },
    [ExternalSourceEnum.CSV]: { ...NO_SYNC_SERVICE, supportsDeposit: true },
    [ExternalSourceEnum.BINANCE]: {
        supportsTokenAuth: true,
        supportsFileImport: false,
        supportsDeposit: false
    },
    [ExternalSourceEnum.COINBASE]: { ...NO_SYNC_SERVICE, supportsDeposit: false },
    [ExternalSourceEnum.RECEIPT]: { ...NO_SYNC_SERVICE, supportsDeposit: false }
};
