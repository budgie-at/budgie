import { type BankSyncEntityInterface, BankSyncEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

export const fetchBankSyncById = (id: number): BankSyncEntityInterface => {
    const [row] = testDb.select().from(BankSyncEntityTable).where(eq(BankSyncEntityTable.id, id)).all();

    return row;
};
