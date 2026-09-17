import { TransactionEntityTable, TransactionEntryEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { and, eq, isNull } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

export const fetchMonobankAdjustments = (accountId: number) =>
    testDb
        .select({
            id: TransactionEntityTable.id,
            amount: TransactionEntryEntityTable.amount,
            entryType: TransactionEntryEntityTable.type
        })
        .from(TransactionEntityTable)
        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
        .where(
            and(
                eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
                eq(TransactionEntryEntityTable.accountId, accountId),
                isNull(TransactionEntityTable.deletedAt),
                isNull(TransactionEntryEntityTable.deletedAt)
            )
        )
        .all();
