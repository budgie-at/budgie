import { AccountAssociationEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { AccountWithBankSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

export const buildIntegrationProviderMap = (
    accounts: readonly Pick<AccountWithBankSyncEntityInterface, 'integrationId' | AccountAssociationEnum.BANK_SYNC>[]
): Map<number, ExternalSourceEnum> => {
    const integrationProviders = new Map<number, ExternalSourceEnum>();

    accounts.forEach(account => {
        const provider = account.bankSync?.provider;

        if (isDefined(account.integrationId) && isDefined(provider)) {
            integrationProviders.set(account.integrationId, provider);
        }
    });

    return integrationProviders;
};
