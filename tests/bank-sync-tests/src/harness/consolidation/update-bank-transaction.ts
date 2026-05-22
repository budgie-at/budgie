import { eq } from 'drizzle-orm';

import { TransactionEntityTable } from '@budgie/contracts';

import { testDb } from '../scenario/setup';

import type { TransactionCreateEntityInterface } from '@budgie/contracts';

type UpdateBankTransactionInputType = Partial<Pick<TransactionCreateEntityInterface, 'externalSource' | 'title'>>;

export const updateBankTransaction = (transactionId: number, input: UpdateBankTransactionInputType): void => {
    testDb.update(TransactionEntityTable).set(input).where(eq(TransactionEntityTable.id, transactionId)).run();
};
