import type { P2pFiatDirectionEnum } from '../../auto/enum/p2p-fiat-direction.enum';
import type { TransactionRunnerType } from '../../wiring/type/transaction-runner.type';
import type { DB, TransactionEntryRepository, TransactionRepository, TransactionTagsRepository } from '@budgie/contracts';

export interface ConsolidationExecutorDependenciesInterface {
    readonly database: DB;
    readonly resolveP2pTransferTitle: (direction: P2pFiatDirectionEnum, assetCode: string) => string;
    readonly transactionEntryRepository: Pick<
        TransactionEntryRepository,
        | 'bulkCreate'
        | 'deleteByTransactionId'
        | 'deleteLedgerByTransactionId'
        | 'hasMovedSourceEntries'
        | 'moveBackToOriginalTransactions'
        | 'moveToConsolidatedTransaction'
        | 'updateById'
    >;
    readonly transactionRepository: Pick<
        TransactionRepository,
        | 'clearConsolidationParent'
        | 'create'
        | 'deleteById'
        | 'findByIds'
        | 'getByIdRaw'
        | 'setConsolidationParent'
        | 'setConsolidationType'
        | 'updateById'
    >;
    readonly runTransaction: TransactionRunnerType;
    readonly transactionTagsRepository: Pick<
        TransactionTagsRepository,
        'bulkCreate' | 'deleteByTransactionId' | 'findByTransactionId' | 'findByTransactionIds'
    >;
}
