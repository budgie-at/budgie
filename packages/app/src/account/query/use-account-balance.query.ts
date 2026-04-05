import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

export const useAccountBalanceQuery = (accountId: number) => {
    const { data } = useLiveQuery(accountBalanceRepository.getByAccountId(accountId), [accountId]);
    const previousBalanceRef = useRef(0);

    const balance = data.at(0)?.balance;

    if (isDefined(balance)) {
        previousBalanceRef.current = convertFromMicroUnits(balance);
    }

    return { balance: previousBalanceRef.current };
};
