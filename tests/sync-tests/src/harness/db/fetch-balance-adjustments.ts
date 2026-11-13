import { TransactionEntityTable, TransactionEntryEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { and, eq } from 'drizzle-orm';

import { testDb } from '../scenario/test-db';

export const fetchBalanceAdjustments = (accountId: number) =>
    testDb
        .select({
            title: TransactionEntityTable.title,
            amount: TransactionEntryEntityTable.amount,
            type: TransactionEntryEntityTable.type,
            operatedAt: TransactionEntityTable.operatedAt
        })
        .from(TransactionEntryEntityTable)
        .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
        .where(and(eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT), eq(TransactionEntryEntityTable.accountId, accountId)));
