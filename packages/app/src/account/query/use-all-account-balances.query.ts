import { AccountBalanceEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';

export const useAllAccountBalancesQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(accountBalanceRepository.getAllBalances());

    const balancesMap = useMemo(
        () => new Map(data.map((balance: AccountBalanceEntityInterface) => [balance.accountId, balance.amount])),
        [data]
    );

    return { balancesMap, isLoading: !isDefined(updatedAt), error };
};
