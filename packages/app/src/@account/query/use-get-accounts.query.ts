import { AccountEntityTable, AccountTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '../../drizzle/db/db';

import type { UseQueryResultInterface } from '../../drizzle/interface/use-query-result.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

type AccountGroups = Partial<Record<AccountTypeEnum, AccountEntityInterface[]>>;

export const useGetAccountsQuery = (): UseQueryResultInterface<AccountGroups> => {
    const { data, ...rest } = useLiveQuery(db.select().from(AccountEntityTable));

    return {
        data: data.reduce<AccountGroups>((acc, curr) => ({
                ...acc,
                [curr.type]: [...(acc[curr.type] ?? []), curr]
            }), {}),
        ...rest
    };
};
