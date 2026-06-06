import type { TransactionRunnerInterface } from '../../wiring/interface/transaction-runner.interface';
import type {
    DB,
    RefundPairRepository,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionTagsRepository
} from '@budgie/contracts';

export interface RefundConsolidationDependenciesInterface {
    readonly database: DB;
    readonly refundPairRepository: Pick<RefundPairRepository, 'findRefundableExpenseCandidates'>;
    readonly transactionEntryRepository: Pick<TransactionEntryRepository, 'moveToConsolidatedTransaction'>;
    readonly transactionRepository: Pick<TransactionRepository, 'findByIds' | 'setConsolidationParent' | 'setConsolidationType'>;
    readonly transactionRunner: TransactionRunnerInterface;
    readonly transactionTagsRepository: Pick<TransactionTagsRepository, 'bulkCreate' | 'findByTransactionId' | 'findByTransactionIds'>;
}
