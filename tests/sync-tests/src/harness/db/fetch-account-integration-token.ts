import { AccountEntityTable, BankIntegrationEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { testDb } from '../scenario/setup';

export const fetchAccountIntegrationToken = (accountId: number): string | null => {
    const [account] = testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, accountId)).all();
    if (!isDefined(account?.integrationId)) {
        return null;
    }

    const [integration] = testDb
        .select()
        .from(BankIntegrationEntityTable)
        .where(eq(BankIntegrationEntityTable.id, account.integrationId))
        .all();

    return integration?.token ?? null;
};
