import { AccountFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

export const useSearchAccountsSortedQuery = (search = '', filter?: AccountFilterInterface) => {
    const excludeAccountId = filter?.excludeAccountId;
    const excludeTypes = filter?.excludeTypes;
    const excludeTypesKey = excludeTypes?.join(',');

    const { data, updatedAt, error } = useLiveQuery(
        accountRepository.findBySearchQuerySortedByBalance(search, { excludeAccountId, excludeTypes }),
        [search, excludeAccountId, excludeTypesKey]
    );

    if (!isDefined(updatedAt)) {
        return { isLoading: true, accounts: [], updatedAt: null, error };
    }

    return {
        isLoading: false,
        accounts: data,
        error
    };
};
