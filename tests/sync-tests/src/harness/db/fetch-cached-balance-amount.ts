import { AccountBalanceEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

export const fetchCachedBalanceAmount = (accountId: number) =>
    Effect.gen(function* () {
        const [row] = yield* testDb.select().from(AccountBalanceEntityTable).where(eq(AccountBalanceEntityTable.accountId, accountId));

        return row?.amount;
    });
