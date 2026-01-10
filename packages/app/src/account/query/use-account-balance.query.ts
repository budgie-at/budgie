import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

interface Options {
    readonly skip?: boolean;
}

const SKIP_ID = -1;

export const useAccountBalanceQuery = (accountId: number, options: Options = {}) => {
    const { skip = false } = options;
    const queryId = skip ? SKIP_ID : accountId;
    const { data } = useLiveQuery(accountBalanceRepository.getByAccountId(queryId), [queryId]);

    if (skip) {
        return { balance: 0 };
    }

    const { balance } = data.at(0) ?? { balance: 0 };

    return { balance: convertFromMicroUnits(balance) };
};
