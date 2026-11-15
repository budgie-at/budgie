import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { groupBy } from '../../@generic/utils/group-by.util';

import { countHoldingPositions } from './count-holding-positions.util';
import { getIntegrationGroupNumber } from './get-integration-group-number.util';
import { isFiatAccount } from './is-fiat-account.util';
import { resolveBankProviderGroup } from './resolve-bank-provider-group.util';
import { sumConvertedBalances } from './sum-converted-balances.util';

import type { HomeAccountBalanceInterface } from '../interface/home-account-balance.interface';
import type { InstitutionGroupInterface } from '../interface/institution-group.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

export const buildInstitutionGroups = (
    providerAccounts: AccountWithSyncEntityInterface[],
    integrationProviders: ReadonlyMap<number, ExternalSourceEnum>,
    integrationLabels: ReadonlyMap<number, string | null>,
    balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>
): InstitutionGroupInterface[] => {
    const entries = [...groupBy(providerAccounts, account => account.integrationId)].flatMap(([integrationId, accounts]) => {
        const provider = resolveBankProviderGroup(integrationId, integrationProviders)?.provider;

        return isDefined(provider) && isDefined(integrationId)
            ? [{ provider, integrationId, label: integrationLabels.get(integrationId) ?? null, accounts }]
            : [];
    });

    const integrations = entries.map(({ integrationId, provider, label }) => ({ id: integrationId, provider, label }));

    return entries.map((entry, index) => ({
        ...entry,
        groupNumber: getIntegrationGroupNumber(integrations, integrations[index]),
        total: sumConvertedBalances(entry.accounts, balancesByAccountId),
        cash: sumConvertedBalances(entry.accounts.filter(isFiatAccount), balancesByAccountId),
        positionCount: countHoldingPositions(entry.accounts, () => true),
        isHoldingProvider:
            entry.provider === ExternalSourceEnum.MANUAL || entry.accounts.every(account => account.type === AccountTypeEnum.CRYPTO_SYNC)
    }));
};
