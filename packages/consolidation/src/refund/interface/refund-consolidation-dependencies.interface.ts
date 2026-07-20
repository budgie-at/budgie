import type { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import type { TransactionRunnerType } from '../../wiring/type/transaction-runner.type';
import type { DB, TransactionEntryRepository, TransactionRepository, TransactionTagsRepository } from '@budgie/contracts';

export interface RefundConsolidationDependenciesInterface {
    readonly database: DB;
    readonly refundPairRepository: Pick<RefundPairRepository, 'findRefundableExpenseCandidates'>;
    readonly transactionEntryRepository: Pick<TransactionEntryRepository, 'moveToConsolidatedTransaction'>;
    readonly transactionRepository: Pick<
        TransactionRepository,
        'findByIdsWithRefundConsolidationHistory' | 'setConsolidationParent' | 'setConsolidationType'
    >;
    readonly runTransaction: TransactionRunnerType;
    readonly transactionTagsRepository: Pick<TransactionTagsRepository, 'bulkCreate' | 'findByTransactionId' | 'findByTransactionIds'>;
}
