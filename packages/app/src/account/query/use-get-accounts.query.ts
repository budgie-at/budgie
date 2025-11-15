import { AccountEntityTable } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '../../@generic/drizzle/db/db';

import type { UseQueryResultInterface } from '../../@generic/drizzle/interface/use-query-result.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

export const useGetAccountsQuery = (): UseQueryResultInterface<AccountEntityInterface[]> =>
    useLiveQuery(db.select().from(AccountEntityTable));
