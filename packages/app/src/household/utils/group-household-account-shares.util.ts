import { AccountTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { groupBy } from '../../@generic/utils/group-by.util';
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

const compareGroups = (left: HouseholdAccountShareGroupInterface, right: HouseholdAccountShareGroupInterface): number => {
    if (isDefined(left.integration) && isDefined(right.integration)) {
        return (
            `${left.integration.provider} ${left.integration.label ?? ''}`.localeCompare(
                `${right.integration.provider} ${right.integration.label ?? ''}`
            ) || (left.groupNumber ?? 0) - (right.groupNumber ?? 0)
        );
    }

    return (
        (isDefined(left.integration) ? -1 : TYPE_ORDER.indexOf(left.type)) -
        (isDefined(right.integration) ? -1 : TYPE_ORDER.indexOf(right.type))
    );
};

export const groupHouseholdAccountShares = (
    accounts: readonly HouseholdAccountShareEntryInterface[]
): HouseholdAccountShareGroupInterface[] => {
    const groups = [
        ...groupBy(accounts, account => (isDefined(account.integration) ? `bank-${account.integration.id}` : `type-${account.type}`))
    ].map(([key, groupAccounts]) => ({
        key,
        type: groupAccounts[0].type,
        integration: groupAccounts[0].integration,
        accounts: groupAccounts
    }));
    const integrations = groups.flatMap(({ integration }) => (isDefined(integration) ? [integration] : []));

    return groups
        .map(group => ({
            ...group,
            groupNumber: isDefined(group.integration) ? getIntegrationGroupNumber(integrations, group.integration) : null
        }))
        .sort(compareGroups);
};
