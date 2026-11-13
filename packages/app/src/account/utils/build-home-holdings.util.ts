import { isPositiveNumber } from '@rnw-community/shared';

import { groupBy } from '../../@generic/utils/group-by.util';

import type { HomeAccountBalanceInterface } from '../interface/home-account-balance.interface';
import type { HomeHoldingInterface } from '../interface/home-holding.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

export const buildHomeHoldings = (
    accounts: readonly AccountWithSyncEntityInterface[],
    balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>,
    sectionTotal: number
): HomeHoldingInterface[] =>
    [...groupBy(accounts, account => account.instrument.id).values()]
        .map(group => {
            const balances = group.map(account => balancesByAccountId.get(account.id));
            const value = balances.reduce((total, balance) => total + (balance?.convertedBalance ?? 0), 0);

            return {
                instrument: group[0].instrument,
                accounts: group,
                balance: balances.reduce((total, balance) => total + (balance?.balance ?? 0), 0),
                value,
                isValued: balances.every(balance => balance?.isValued === true),
                weight: isPositiveNumber(value) && isPositiveNumber(sectionTotal) ? value / sectionTotal : null
            };
        })
        .sort((left, right) => right.value - left.value);
