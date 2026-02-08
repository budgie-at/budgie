import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

export const useAccountBalanceQuery = (accountId: number) => {
    const queryStart = performance.now();
    const { data } = useLiveQuery(accountBalanceRepository.getByAccountId(accountId), [accountId]);
    // eslint-disable-next-line no-console
    console.log(`[perf] useAccountBalanceQuery(${accountId}): ${Math.round(performance.now() - queryStart)}ms`); // eslint-disable-line lingui/no-unlocalized-strings
    const { balance } = data.at(0) ?? { balance: 0 };

    return { balance: convertFromMicroUnits(balance) };
};
