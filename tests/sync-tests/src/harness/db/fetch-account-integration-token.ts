import { AccountEntityTable, BankIntegrationEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { testDb } from '../scenario/setup';

export const fetchAccountIntegrationToken = (accountId: number) =>
    Effect.gen(function* () {
        const [account] = yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, accountId));
        if (!isDefined(account?.integrationId)) {
            return null;
        }

        const [integration] = yield* testDb
            .select()
            .from(BankIntegrationEntityTable)
            .where(eq(BankIntegrationEntityTable.id, account.integrationId));

        return integration?.token ?? null;
    });
