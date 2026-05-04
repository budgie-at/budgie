import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';

import type { DB } from '@budgie/contracts';

export const unconsolidateByIdInTransaction = async (transactionId: number, tx: DB): Promise<void> => {
    const canonical = await transactionRepository.getById(transactionId, tx);

    await transactionEntryRepository.moveBackToOriginalTransactions(transactionId, tx);
    await transactionRepository.clearConsolidationParent(transactionId, tx);

    if (isDefined(canonical) && canonical.consolidationType === TransactionConsolidationTypeEnum.REFUND) {
        await transactionRepository.setConsolidationType(transactionId, null, tx);

        return;
    }

    await transactionTagsRepository.deleteByTransactionId(transactionId, tx);
    await transactionEntryRepository.deleteLedgerByTransactionId(transactionId, tx);
    await transactionRepository.deleteById(transactionId, tx);
};
