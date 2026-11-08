import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { getAccountDisplayTitle } from './get-account-display-title.util';
import { isUntrackedOwnAccount } from './is-untracked-own-account.util';

import type { AccountEntityInterface } from '@budgie/contracts';

export const getShelvedAccountsList = <T extends Pick<AccountEntityInterface, 'title' | 'externalId'>>(
    accounts: T[] | null,
    search: string
) => {
    if (!isDefined(accounts)) {
        return { accounts, shelvedCount: 0 };
    }

    const normalizedSearch = search.trim().toLowerCase();
    const matchingAccounts = isNotEmptyString(normalizedSearch)
        ? accounts.filter(account => getAccountDisplayTitle(account).toLowerCase().includes(normalizedSearch))
        : accounts;
    const shelvedAccounts = matchingAccounts.filter(account => !isUntrackedOwnAccount(account));

    return {
        accounts: [...shelvedAccounts, ...matchingAccounts.filter(isUntrackedOwnAccount)],
        shelvedCount: shelvedAccounts.length
    };
};
