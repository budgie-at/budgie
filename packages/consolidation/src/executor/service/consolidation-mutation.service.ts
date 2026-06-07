import { CategorySourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

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
        (input, tx) =>
            `enter title="${input.title}" fromAccountId=${input.fromAccountId} toAccountId=${input.toAccountId} fromAmount=${input.fromAmount} toAmount=${input.toAmount} type=${input.consolidationType} hasTx=${String(isDefined(tx))}`,
        (result, input, tx) =>
            `done title="${input.title}" fromAccountId=${input.fromAccountId} toAccountId=${input.toAccountId} fromAmount=${input.fromAmount} toAmount=${input.toAmount} type=${input.consolidationType} hasTx=${String(isDefined(tx))} canonicalTransactionId=${result.id}`,
        (error, input, tx) =>
            `throw title="${input.title}" fromAccountId=${input.fromAccountId} toAccountId=${input.toAccountId} fromAmount=${input.fromAmount} toAmount=${input.toAmount} type=${input.consolidationType} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
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
        (candidate, sourceTransactions, canonicalTransactionId, tx) =>
            `enter transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} sourceTransactionIds=${sourceTransactions.map(transaction => transaction.id).join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))}`,
        (result, ...inputs) => {
            const [candidate, sourceTransactions, canonicalTransactionId, tx] = inputs;

            return `done transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} sourceTransactionIds=${sourceTransactions.map(transaction => transaction.id).join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))} result=${String(result)}`;
        },
        (error, ...inputs) => {
            const [candidate, sourceTransactions, canonicalTransactionId, tx] = inputs;

            return `throw transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} sourceTransactionIds=${sourceTransactions.map(transaction => transaction.id).join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`;
        }
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
        (sourceTransactionIds, canonicalTransactionId, tx) =>
            `enter sourceTransactionIds=${sourceTransactionIds.join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))}`,
        (result, sourceTransactionIds, canonicalTransactionId, tx) =>
            `done sourceTransactionIds=${sourceTransactionIds.join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))} result=${String(result)}`,
        (error, sourceTransactionIds, canonicalTransactionId, tx) =>
            `throw sourceTransactionIds=${sourceTransactionIds.join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async moveSourcesToCanonical(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        await this.dependencies.transactionEntryRepository.moveToConsolidatedTransaction(sourceTransactionIds, canonicalTransactionId, tx);
        await this.dependencies.transactionRepository.setConsolidationParent(sourceTransactionIds, canonicalTransactionId, tx);
    }

    @Log(
        (sourceTransactionIds, canonicalTransactionId, tx) =>
            `enter sourceTransactionIds=${sourceTransactionIds.join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))}`,
        (result, sourceTransactionIds, canonicalTransactionId, tx) =>
            `done sourceTransactionIds=${sourceTransactionIds.join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))} result=${String(result)}`,
        (error, sourceTransactionIds, canonicalTransactionId, tx) =>
            `throw sourceTransactionIds=${sourceTransactionIds.join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
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
