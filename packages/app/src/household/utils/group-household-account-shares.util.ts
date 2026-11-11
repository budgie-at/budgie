import { AccountTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { HouseholdAccountShareEntryInterface } from '../interface/household-account-share-entry.interface';
import type { HouseholdAccountShareGroupInterface } from '../interface/household-account-share-group.interface';

const TYPE_ORDER = [
    AccountTypeEnum.CASH,
    AccountTypeEnum.BANK,
    AccountTypeEnum.BANK_SYNC,
    AccountTypeEnum.SAVINGS,
    AccountTypeEnum.DEPOSIT,
    AccountTypeEnum.CRYPTO,
    AccountTypeEnum.CRYPTO_SYNC,
    AccountTypeEnum.STOCKS,
    AccountTypeEnum.DEBT
];

const getGroupRank = ({ integration, type }: Pick<HouseholdAccountShareGroupInterface, 'integration' | 'type'>): number =>
    isDefined(integration) ? -1 : TYPE_ORDER.indexOf(type);

const getBankSortKey = ({ integration }: Pick<HouseholdAccountShareGroupInterface, 'integration'>): string =>
    isDefined(integration) ? `${integration.provider} ${integration.label ?? ''}` : '';

export const groupHouseholdAccountShares = (
    accounts: readonly HouseholdAccountShareEntryInterface[]
): HouseholdAccountShareGroupInterface[] => {
    const groups = new Map<string, Omit<HouseholdAccountShareGroupInterface, 'groupNumber'>>();

    accounts.forEach(account => {
        const key = isDefined(account.integration) ? `bank-${account.integration.id}` : `type-${account.type}`;

        groups.set(key, {
            key,
            type: account.type,
            integration: account.integration,
            accounts: [...(groups.get(key)?.accounts ?? []), account]
        });
    });

    const unlabeledIntegrations = [...groups.values()]
        .flatMap(({ integration }) => (isDefined(integration) && !isDefined(integration.label) ? [integration] : []))
        .sort((left, right) => left.id - right.id);

    return [...groups.values()]
        .map(group => {
            const sameProvider = unlabeledIntegrations.filter(integration => integration.provider === group.integration?.provider);
            const index = sameProvider.findIndex(integration => integration.id === group.integration?.id);

            return { ...group, groupNumber: sameProvider.length > 1 && index >= 0 ? index + 1 : null };
        })
        .sort(
            (left, right) =>
                getGroupRank(left) - getGroupRank(right) ||
                getBankSortKey(left).localeCompare(getBankSortKey(right)) ||
                (left.groupNumber ?? 0) - (right.groupNumber ?? 0)
        );
};
