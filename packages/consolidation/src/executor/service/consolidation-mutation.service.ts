import { CategorySourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { isDefined, isError, isPositiveNumber } from '@rnw-community/shared';

import { consolidationCopySourceTransactionTags } from '../../shared/utils/consolidation-copy-source-transaction-tags.util';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    DB,
    TransactionEntityInterface,
    TransactionEntryEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class ConsolidationMutationService {
    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {}

    @Log(
        () => 'enter canonicalTransfer',
        () => 'done canonicalTransfer',
        error => `throw canonicalTransferErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async createCanonicalTransfer(input: CanonicalTransferInputInterface, tx: DB): Promise<TransactionEntityInterface> {
        const canonicalTransaction = await this.dependencies.transactionRepository.create(
            {
                type: TransactionTypeEnum.TRANSFER,
                title: input.title,
                externalId: null,
                operatedAt: new Date(input.operatedAt * 1000),
                comment: '',
                toAccountId: input.toAccountId,
                fromAccountId: input.fromAccountId,
                exchangeRate: input.exchangeRate,
                externalSource: null,
                needsEmbedding: false,
                consolidationType: input.consolidationType,
                consolidationParentTransactionId: null,
                updatedBy: null
            },
            tx
        );

        await this.dependencies.transactionEntryRepository.bulkCreate(
            [
                {
                    transactionId: canonicalTransaction.id,
                    accountId: input.fromAccountId,
                    categoryId: null,
                    mccCategoryId: null,
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: input.fromAmount,
                    externalId: null,
                    exchangeRate: input.fromEntryExchangeRate,
                    toIban: input.fromEntryToIban,
                    originalTransactionId: null
                },
                {
                    transactionId: canonicalTransaction.id,
                    accountId: input.toAccountId,
                    categoryId: null,
                    mccCategoryId: null,
                    type: TransactionEntryTypeEnum.DEBIT,
                    amount: input.toAmount,
                    externalId: null,
                    exchangeRate: input.toEntryExchangeRate,
                    toIban: null,
                    originalTransactionId: null
                }
            ],
            tx
        );

        return canonicalTransaction;
    }

    @Log(
        () => 'enter atmWithdrawalFeeEntry',
        () => 'done atmWithdrawalFeeEntry',
        error => `throw atmWithdrawalFeeEntryErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async createAtmCashWithdrawalFeeEntry(
        candidate: AtmCashWithdrawalCandidateInterface,
        sourceTransactions: TransactionWithEntriesEntityInterface[],
        canonicalTransactionId: number,
        tx: DB
    ): Promise<void> {
        const feeEntry = this.findAtmCashWithdrawalFeeEntry(candidate, sourceTransactions);

        if (!isDefined(feeEntry)) {
            return;
        }

        await this.dependencies.transactionEntryRepository.bulkCreate(
            [
                {
                    transactionId: canonicalTransactionId,
                    accountId: candidate.sourceAccountId,
                    categoryId: feeEntry.categoryId,
                    categorySource: feeEntry.categorySource,
                    mccCategoryId: feeEntry.mccCategoryId,
                    type: TransactionEntryTypeEnum.FEE,
                    amount: feeEntry.amount,
                    externalId: null,
                    exchangeRate: feeEntry.exchangeRate,
                    baseInstrumentId: feeEntry.baseInstrumentId,
                    baseExchangeRate: feeEntry.baseExchangeRate,
                    baseAmount: feeEntry.baseAmount,
                    toIban: null,
                    originalTransactionId: null
                }
            ],
            tx
        );
    }

    @Log(
        () => 'enter moveSources',
        () => 'done moveSources',
        error => `throw moveSourcesErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async moveSourcesToCanonical(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        await this.dependencies.transactionEntryRepository.moveToConsolidatedTransaction(sourceTransactionIds, canonicalTransactionId, tx);
        await this.dependencies.transactionRepository.setConsolidationParent(sourceTransactionIds, canonicalTransactionId, tx);
    }

    @Log(
        () => 'enter copySourceTags',
        () => 'done copySourceTags',
        error => `throw copySourceTagsErrorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async copySourceTags(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        await consolidationCopySourceTransactionTags(
            this.dependencies.transactionTagsRepository,
            sourceTransactionIds,
            canonicalTransactionId,
            tx
        );
    }

    private findAtmCashWithdrawalFeeEntry(
        candidate: AtmCashWithdrawalCandidateInterface,
        sourceTransactions: TransactionWithEntriesEntityInterface[]
    ): TransactionEntryEntityInterface | undefined {
        return sourceTransactions
            .flatMap(transaction => transaction.entries)
            .find(
                entry =>
                    entry.accountId === candidate.sourceAccountId &&
                    (entry.type === TransactionEntryTypeEnum.FEE || entry.categorySource === CategorySourceEnum.FEE) &&
                    isPositiveNumber(entry.amount)
            );
    }
}
