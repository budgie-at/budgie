import { ExternalSourceEnum } from '@budgie/contracts';
import { SYNC_PROVIDER_CAPABILITIES } from '@budgie/sync';

import { isNotEmptyString } from '@rnw-community/shared';

import type { BankIntegrationEntityInterface } from '@budgie/contracts';

export const getBankIntegrationCapabilities = (integration: Pick<BankIntegrationEntityInterface, 'provider' | 'token'>) => {
    const providerCapabilities = SYNC_PROVIDER_CAPABILITIES[integration.provider];
    const hasToken = isNotEmptyString(integration.token);
    const supportsLiveSync = hasToken && providerCapabilities.supportsTokenAuth;

    return {
        supportsLiveSync,
        supportsFileImport: !hasToken && providerCapabilities.supportsFileImport,
        supportsAccountDiscovery: supportsLiveSync && integration.provider === ExternalSourceEnum.MONOBANK,
        supportsDeposit: providerCapabilities.supportsDeposit
    };
};
