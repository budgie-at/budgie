import { AccountAssociationEnum, AccountTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { buildBankProviderGroupKey } from './build-bank-provider-group-key.util';

import type { AccountWithBankSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

export const resolveBankProviderGroup = (
    account: Pick<AccountWithBankSyncEntityInterface, 'type' | 'integrationId' | AccountAssociationEnum.BANK_SYNC>,
    integrationProviders: ReadonlyMap<number, ExternalSourceEnum>
): { key: string; integrationId: number | null; provider: ExternalSourceEnum } | null => {
    const directProvider = account.type === AccountTypeEnum.BANK_SYNC ? (account.bankSync?.provider ?? null) : null;
    const linkedProvider = isDefined(account.integrationId) ? (integrationProviders.get(account.integrationId) ?? null) : null;
    const provider = directProvider ?? linkedProvider;

    if (!isDefined(provider)) {
        return null;
    }

    return {
        key: buildBankProviderGroupKey(account.integrationId, provider),
        integrationId: account.integrationId,
        provider
    };
};
