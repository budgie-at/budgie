import { AccountEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '../../drizzle/db/db';

import type { UseQueryResultInterface } from '../../drizzle/interface/use-query-result.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

export const useGetAccountByIdQuery = (id: AccountEntityInterface['id']): UseQueryResultInterface<AccountEntityInterface[]> => useLiveQuery(db.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, id)).limit(1));
