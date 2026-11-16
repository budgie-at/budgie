import type { HomeAccountBalanceInterface } from '../interface/home-account-balance.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

export const sumConvertedBalances = (
    accounts: readonly Pick<AccountWithSyncEntityInterface, 'id'>[],
    balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>
): number => accounts.reduce((total, account) => total + (balancesByAccountId.get(account.id)?.convertedBalance ?? 0), 0);
