import { transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';

import type { DB } from '@budgie/contracts';

export const unconsolidateByIdInTransaction = async (transactionId: number, tx: DB): Promise<void> => {
    await transactionEntryRepository.moveBackToOriginalTransactions(transactionId, tx);
    await transactionRepository.clearConsolidationParent(transactionId, tx);
    await transactionTagsRepository.deleteByTransactionId(transactionId, tx);
    await transactionEntryRepository.deleteLedgerByTransactionId(transactionId, tx);
    await transactionRepository.deleteById(transactionId, tx);
};
