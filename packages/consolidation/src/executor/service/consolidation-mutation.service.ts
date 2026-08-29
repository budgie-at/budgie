import { CategorySourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { P2pFiatDirectionEnum } from '../../auto/enum/p2p-fiat-direction.enum';
import { consolidationCopySourceTransactionTags } from '../../shared/utils/consolidation-copy-source-transaction-tags.util';

import type { P2pFiatTransferCandidateInterface } from '../../auto/interface/p2p-fiat-transfer-candidate.interface';
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

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async createAtmCashWithdrawalFeeEntry(
        candidate: AtmCashWithdrawalCandidateInterface,
        sourceTransactions: TransactionWithEntriesEntityInterface[],
        canonicalTransactionId: number,
        tx: DB
    ): Promise<void> {
        const feeEntry = this.findFeeEntries(candidate.sourceAccountId, sourceTransactions).at(0);

        if (!isDefined(feeEntry)) {
            return;
        }

        await this.createCanonicalFeeEntries(candidate.sourceAccountId, [feeEntry], canonicalTransactionId, tx);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async createP2pFiatTransferFeeEntries(
        candidate: P2pFiatTransferCandidateInterface,
        sourceTransactions: TransactionWithEntriesEntityInterface[],
        canonicalTransactionId: number,
        tx: DB
    ): Promise<void> {
        const bankAccountId = candidate.direction === P2pFiatDirectionEnum.BUY ? candidate.fromAccountId : candidate.toAccountId;
        const feeEntries = this.findFeeEntries(bankAccountId, sourceTransactions).filter(entry =>
            candidate.bankTransactionIds.includes(entry.transactionId)
        );

        if (!isNotEmptyArray(feeEntries)) {
            return;
        }

        await this.createCanonicalFeeEntries(bankAccountId, feeEntries, canonicalTransactionId, tx);
    }

    @Log(
        (sourceTransactionIds, canonicalTransactionId, tx) =>
            `enter moveSources ids=${sourceTransactionIds.join(',')} parent=${canonicalTransactionId} tx=${String(isDefined(tx))}`,
        (result, sourceTransactionIds, canonicalTransactionId, tx) =>
            `done moved=${String(result)} ids=${sourceTransactionIds.join(',')} parent=${canonicalTransactionId} tx=${String(isDefined(tx))}`,
        (error, sourceTransactionIds, canonicalTransactionId, tx) =>
            `throw moveSources ids=${sourceTransactionIds.join(',')} parent=${canonicalTransactionId} tx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async moveSourcesToCanonical(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        await this.dependencies.transactionEntryRepository.moveToConsolidatedTransaction(sourceTransactionIds, canonicalTransactionId, tx);
        await this.dependencies.transactionRepository.setConsolidationParent(sourceTransactionIds, canonicalTransactionId, tx);
    }

    @Log(
        (sourceTransactionIds, canonicalTransactionId, tx) =>
            `enter copyTags from=${sourceTransactionIds.join(',')} to=${canonicalTransactionId} tx=${String(isDefined(tx))}`,
        (result, sourceTransactionIds, canonicalTransactionId, tx) =>
            `done tagsCopied=${String(result)} from=${sourceTransactionIds.join(',')} to=${canonicalTransactionId} tx=${String(isDefined(tx))}`,
        (error, sourceTransactionIds, canonicalTransactionId, tx) =>
            `throw copyTags from=${sourceTransactionIds.join(',')} to=${canonicalTransactionId} tx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async copySourceTags(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        await consolidationCopySourceTransactionTags(
            this.dependencies.transactionTagsRepository,
            sourceTransactionIds,
            canonicalTransactionId,
            tx
        );
    }

    private async createCanonicalFeeEntries(
        accountId: number,
        feeEntries: TransactionEntryEntityInterface[],
        canonicalTransactionId: number,
        tx: DB
    ): Promise<void> {
        await this.dependencies.transactionEntryRepository.bulkCreate(
            feeEntries.map(feeEntry => ({
                transactionId: canonicalTransactionId,
                accountId,
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
            })),
            tx
        );
    }

    private findFeeEntries(
        accountId: number,
        sourceTransactions: TransactionWithEntriesEntityInterface[]
    ): TransactionEntryEntityInterface[] {
        return sourceTransactions
            .flatMap(transaction => transaction.entries)
            .filter(
                entry =>
                    entry.accountId === accountId &&
                    (entry.type === TransactionEntryTypeEnum.FEE || entry.categorySource === CategorySourceEnum.FEE) &&
                    isPositiveNumber(entry.amount)
            );
    }
}
