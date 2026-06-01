import type { TransactionRunnerInterface } from '../../wiring/interface/transaction-runner.interface';
import type { DB, TransactionEntryRepository, TransactionRepository, TransactionTagsRepository } from '@budgie/contracts';

export interface ConsolidationExecutorDependenciesInterface {
    readonly database: DB;
    readonly transactionEntryRepository: Pick<
        TransactionEntryRepository,
        'bulkCreate' | 'hasMovedSourceEntries' | 'moveToConsolidatedTransaction' | 'updateById'
    >;
    readonly transactionRepository: Pick<
        TransactionRepository,
        'create' | 'findByIds' | 'getByIdRaw' | 'setConsolidationParent' | 'setConsolidationType' | 'updateById'
    >;
    readonly transactionRunner: TransactionRunnerInterface;
    readonly transactionTagsRepository: Pick<TransactionTagsRepository, 'bulkCreate' | 'findByTransactionId' | 'findByTransactionIds'>;
}
