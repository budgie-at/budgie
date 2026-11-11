import { AccountTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { getIntegrationGroupNumber } from '../../account/utils/get-integration-group-number.util';

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

    const integrations = [...groups.values()].flatMap(({ integration }) => (isDefined(integration) ? [integration] : []));

    return [...groups.values()]
        .map(group => ({
            ...group,
            groupNumber: isDefined(group.integration) ? getIntegrationGroupNumber(integrations, group.integration) : null
        }))
        .sort(
            (left, right) =>
                getGroupRank(left) - getGroupRank(right) ||
                getBankSortKey(left).localeCompare(getBankSortKey(right)) ||
                (left.groupNumber ?? 0) - (right.groupNumber ?? 0)
        );
};
