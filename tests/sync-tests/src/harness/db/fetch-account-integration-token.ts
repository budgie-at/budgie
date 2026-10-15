import { AccountEntityTable, BankIntegrationEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { testDb } from '../scenario/setup';

export const fetchAccountIntegrationToken = (accountId: number) =>
    Effect.gen(function* () {
        const accounts = yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, accountId));
        const integrationId = accounts.at(0)?.integrationId;
        if (!isDefined(integrationId)) {
            return null;
        }

        const integrations = yield* testDb
            .select()
            .from(BankIntegrationEntityTable)
            .where(eq(BankIntegrationEntityTable.id, integrationId));

        return integrations.at(0)?.token ?? null;
    });
