import { CategorySourceEnum, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    DB,
    ExistingTransferIncomeDuplicateCandidateInterface,
    TransactionEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

class ConsolidationWriterService {
    @Log(
        (sourceTransactionIds, tx, allowedMovedSourceTransactionIds) =>
            `enter sourceTransactionIds=${sourceTransactionIds.join(',')} hasTx=${String(isDefined(tx))} allowedMovedSourceTransactionIds=${allowedMovedSourceTransactionIds?.join(',') ?? ''}`,
        (result, sourceTransactionIds, tx, allowedMovedSourceTransactionIds) =>
            `done sourceTransactionIds=${sourceTransactionIds.join(',')} hasTx=${String(isDefined(tx))} allowedMovedSourceTransactionIds=${allowedMovedSourceTransactionIds?.join(',') ?? ''} result=${String(result)}`,
        (error, sourceTransactionIds, tx, allowedMovedSourceTransactionIds) =>
            `throw sourceTransactionIds=${sourceTransactionIds.join(',')} hasTx=${String(isDefined(tx))} allowedMovedSourceTransactionIds=${allowedMovedSourceTransactionIds?.join(',') ?? ''} error=${getErrorMessage(error)}`
    )
    async areCandidatesStillEligible(
        sourceTransactionIds: number[],
        tx: DB,
        allowedMovedSourceTransactionIds: number[] = []
    ): Promise<boolean> {
        return isDefined(await this.findEligibleSourceTransactions(sourceTransactionIds, tx, allowedMovedSourceTransactionIds));
    }

    @Log(
        (sourceTransactionIds, tx, allowedMovedSourceTransactionIds) =>
            `enter sourceTransactionIds=${sourceTransactionIds.join(',')} hasTx=${String(isDefined(tx))} allowedMovedSourceTransactionIds=${allowedMovedSourceTransactionIds?.join(',') ?? ''}`,
        (result, sourceTransactionIds, tx, allowedMovedSourceTransactionIds) =>
            `done sourceTransactionIds=${sourceTransactionIds.join(',')} hasTx=${String(isDefined(tx))} allowedMovedSourceTransactionIds=${allowedMovedSourceTransactionIds?.join(',') ?? ''} found=${String(isDefined(result))}`,
        (error, sourceTransactionIds, tx, allowedMovedSourceTransactionIds) =>
            `throw sourceTransactionIds=${sourceTransactionIds.join(',')} hasTx=${String(isDefined(tx))} allowedMovedSourceTransactionIds=${allowedMovedSourceTransactionIds?.join(',') ?? ''} error=${getErrorMessage(error)}`
    )
    async findEligibleSourceTransactions(
        sourceTransactionIds: number[],
        tx: DB,
        allowedMovedSourceTransactionIds: number[] = []
    ): Promise<TransactionWithEntriesEntityInterface[] | null> {
        const freshTransactions = await transactionRepository.findByIds(sourceTransactionIds, tx);

        if (freshTransactions.length !== sourceTransactionIds.length) {
            return null;
        }

        const movedEntryBlockedTransactionIds = sourceTransactionIds.filter(
            transactionId => !allowedMovedSourceTransactionIds.includes(transactionId)
        );

        if (await transactionEntryRepository.hasMovedSourceEntries(movedEntryBlockedTransactionIds, tx)) {
            return null;
        }

        if (
            freshTransactions.every(
                transaction => !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt)
            )
        ) {
            return freshTransactions;
        }

        return null;
    }

    @Log(
        (transactionId, tx) => `enter transactionId=${transactionId} hasTx=${String(isDefined(tx))}`,
        (result, transactionId, tx) => `done transactionId=${transactionId} hasTx=${String(isDefined(tx))} result=${String(result)}`,
        (error, transactionId, tx) => `throw transactionId=${transactionId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async isExistingTransferStillEligible(transactionId: number, tx: DB): Promise<boolean> {
        const transaction = await transactionRepository.getByIdRaw(transactionId, tx);

        return isDefined(transaction) && !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt);
    }

    @Log(
        (input, tx) =>
            `enter title="${input.title}" fromAccountId=${input.fromAccountId} toAccountId=${input.toAccountId} fromAmount=${input.fromAmount} toAmount=${input.toAmount} exchangeRate=${input.exchangeRate} consolidationType=${input.consolidationType} hasTx=${String(isDefined(tx))}`,
        (result, input, tx) =>
            `done title="${input.title}" fromAccountId=${input.fromAccountId} toAccountId=${input.toAccountId} fromAmount=${input.fromAmount} toAmount=${input.toAmount} exchangeRate=${input.exchangeRate} consolidationType=${input.consolidationType} hasTx=${String(isDefined(tx))} canonicalTransactionId=${result.id}`,
        (error, input, tx) =>
            `throw title="${input.title}" fromAccountId=${input.fromAccountId} toAccountId=${input.toAccountId} fromAmount=${input.fromAmount} toAmount=${input.toAmount} exchangeRate=${input.exchangeRate} consolidationType=${input.consolidationType} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async createCanonicalTransfer(input: CanonicalTransferInputInterface, tx: DB): Promise<TransactionEntityInterface> {
        const canonicalTransaction = await transactionRepository.create(
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

        await transactionEntryRepository.bulkCreate(
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
            `enter transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} sourceTransactionIds=${sourceTransactions.map(transaction => transaction.id).join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))}`,
        (result, ...[candidate, sourceTransactions, canonicalTransactionId, tx]) =>
            `done transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} sourceTransactionIds=${sourceTransactions.map(transaction => transaction.id).join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))} created=${String(result)}`,
        (error, ...[candidate, sourceTransactions, canonicalTransactionId, tx]) =>
            `throw transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} sourceTransactionIds=${sourceTransactions.map(transaction => transaction.id).join(',')} canonicalTransactionId=${canonicalTransactionId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async createAtmCashWithdrawalFeeEntry(
        candidate: AtmCashWithdrawalCandidateInterface,
        sourceTransactions: TransactionWithEntriesEntityInterface[],
        canonicalTransactionId: number,
        tx: DB
    ): Promise<boolean> {
        const feeEntry = sourceTransactions
            .flatMap(transaction => transaction.entries)
            .find(
                entry =>
                    entry.accountId === candidate.sourceAccountId &&
                    isPositiveNumber(entry.amount) &&
                    (entry.type === TransactionEntryTypeEnum.FEE || entry.categorySource === CategorySourceEnum.FEE)
            );

        if (!isDefined(feeEntry)) {
            return false;
        }

        await transactionEntryRepository.bulkCreate(
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

        return true;
    }

    @Log(
        (transactionId, consolidationType, tx) =>
            `enter transactionId=${transactionId} consolidationType=${consolidationType} hasTx=${String(isDefined(tx))}`,
        (result, transactionId, consolidationType, tx) =>
            `done transactionId=${transactionId} consolidationType=${consolidationType} hasTx=${String(isDefined(tx))} result=${String(result)}`,
        (error, transactionId, consolidationType, tx) =>
            `throw transactionId=${transactionId} consolidationType=${consolidationType} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async setConsolidationType(transactionId: number, consolidationType: TransactionConsolidationTypeEnum, tx: DB): Promise<boolean> {
        await transactionRepository.setConsolidationType(transactionId, consolidationType, tx);

        return true;
    }

    @Log(
        (candidate, tx) =>
            `enter existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} targetEntryId=${candidate.existingTransferTargetEntryId} sourceAmount=${candidate.sourceAmount} amount=${candidate.amount} exchangeRate=${candidate.exchangeRate} amountDelta=${candidate.amountDelta} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))}`,
        (result, candidate, tx) =>
            `done existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} targetEntryId=${candidate.existingTransferTargetEntryId} sourceAmount=${candidate.sourceAmount} amount=${candidate.amount} exchangeRate=${candidate.exchangeRate} amountDelta=${candidate.amountDelta} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))} result=${String(result)}`,
        (error, candidate, tx) =>
            `throw existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} targetEntryId=${candidate.existingTransferTargetEntryId} sourceAmount=${candidate.sourceAmount} amount=${candidate.amount} exchangeRate=${candidate.exchangeRate} amountDelta=${candidate.amountDelta} timeDiff=${candidate.timeDiff} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async updateExistingTransferIncomeDuplicate(candidate: ExistingTransferIncomeDuplicateCandidateInterface, tx: DB): Promise<boolean> {
        await transactionRepository.updateById(
            candidate.existingTransferId,
            {
                exchangeRate: candidate.exchangeRate,
                toAccountId: candidate.targetAccountId
            },
            tx
        );
        await transactionEntryRepository.updateById(
            candidate.existingTransferTargetEntryId,
            {
                accountId: candidate.targetAccountId,
                amount: candidate.amount,
                exchangeRate: 1
            },
            tx
        );
        await transactionRepository.setConsolidationType(candidate.existingTransferId, TransactionConsolidationTypeEnum.TRANSFER_PAIR, tx);

        return true;
    }
}

export const consolidationWriterService = new ConsolidationWriterService();
