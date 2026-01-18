import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

export const useGetAccountByIbanQuery = (iban: string | null | undefined) => {
    const { data } = useLiveQuery(accountRepository.findByIban(isNotEmptyString(iban) ? iban : ''), [iban]);

    if (!isDefined(data)) {
        return { isLoading: true, account: null };
    }

    return { account: data, isLoading: false };
};
