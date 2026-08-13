import type { TransactionRunnerType } from '../../wiring/type/transaction-runner.type';
import type { DB, TransactionEntryRepository, TransactionRepository, TransactionTagsRepository } from '@budgie/contracts';

export interface ConsolidationExecutorDependenciesInterface {
    readonly database: DB;
    readonly transactionEntryRepository: Pick<
        TransactionEntryRepository,
        'bulkCreate' | 'hasMovedSourceEntries' | 'moveToConsolidatedTransaction'
    >;
    readonly transactionRepository: Pick<
        TransactionRepository,
        'create' | 'findByIds' | 'getByIdRaw' | 'setConsolidationParent' | 'setConsolidationType'
    >;
    readonly runTransaction: TransactionRunnerType;
    readonly transactionTagsRepository: Pick<TransactionTagsRepository, 'bulkCreate' | 'findByTransactionId' | 'findByTransactionIds'>;
}
