import type { TransactionEntryRepository, TransactionRepository, TransactionTagsRepository } from '@budgie/contracts';

export interface UnconsolidationDependenciesInterface {
    readonly transactionEntryRepository: Pick<TransactionEntryRepository, 'deleteLedgerByTransactionId' | 'moveBackToOriginalTransactions'>;
    readonly transactionRepository: Pick<
        TransactionRepository,
        'clearConsolidationParent' | 'deleteById' | 'getByIdRaw' | 'setConsolidationType'
    >;
    readonly transactionTagsRepository: Pick<TransactionTagsRepository, 'deleteByTransactionId'>;
}
