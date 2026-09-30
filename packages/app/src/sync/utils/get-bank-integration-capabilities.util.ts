import { isNotEmptyString } from '@rnw-community/shared';

import { SYNC_PROVIDER_CAPABILITIES } from '../constant/sync-provider-capabilities.constant';

import type { BankIntegrationCapabilitiesInterface } from '../interface/bank-integration-capabilities.interface';
import type { BankIntegrationEntityInterface } from '@budgie/contracts';

export const getBankIntegrationCapabilities = (
    integration: Pick<BankIntegrationEntityInterface, 'provider' | 'token'>
): BankIntegrationCapabilitiesInterface => {
    const capabilities = SYNC_PROVIDER_CAPABILITIES[integration.provider];
    const supportsLiveSync = isNotEmptyString(integration.token) && capabilities.supportsTokenAuth;

    return {
        supportsLiveSync,
        supportsFileImport: !isNotEmptyString(integration.token) && capabilities.supportsFileImport,
        supportsAddAccounts: supportsLiveSync && capabilities.supportsAddAccounts,
        supportsDeposit: capabilities.supportsDeposit
    };
};
