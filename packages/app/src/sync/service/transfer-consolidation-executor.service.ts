/* eslint-disable max-lines -- Consolidation executor keeps per-candidate logs and the write path together for debugging */
import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    DB,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    RefundCandidateInterface,
    TransactionEntityInterface,
    TransactionTagsEntityInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

class TransferConsolidationExecutorService {
    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff} error=${getErrorMessage(error)}`
    )
    async consolidatePair(candidate: TransferPairCandidateInterface): Promise<boolean> {
        return transactionAsync(db, async tx => this.consolidatePairInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount}`,
        (result, candidate) =>
            `done result=${String(result)} transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount}`,
        (error, candidate) =>
            `throw transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} error=${getErrorMessage(error)}`
    )
    async consolidateAtmCashWithdrawal(candidate: AtmCashWithdrawalCandidateInterface): Promise<boolean> {
        return transactionAsync(db, async tx => this.consolidateAtmCashWithdrawalInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} error=${getErrorMessage(error)}`
    )
    async consolidateIbanBridgeTransfer(candidate: IbanBridgeTransferCandidateInterface): Promise<boolean> {
        return transactionAsync(db, async tx => this.consolidateIbanBridgeTransferInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} existingCanonicalTransferId=${candidate.existingCanonicalTransferId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} timeDiff=${candidate.timeDiff} error=${getErrorMessage(error)}`
    )
    async consolidateIbanBridgeCanonicalDuplicate(candidate: IbanBridgeCanonicalDuplicateCandidateInterface): Promise<boolean> {
        return transactionAsync(db, async tx => this.consolidateIbanBridgeCanonicalDuplicateInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (result, candidate) =>
            `done result=${String(result)} sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (error, candidate) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} existingTransferId=${candidate.existingTransferId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} error=${getErrorMessage(error)}`
    )
    async consolidateExistingTransferBridge(candidate: ExistingTransferBridgeCandidateInterface): Promise<boolean> {
        return transactionAsync(db, async tx => this.consolidateExistingTransferBridgeInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} amount=${candidate.amount} timeDiff=${candidate.timeDiff}`,
        (result, candidate) =>
            `done result=${String(result)} existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} amount=${candidate.amount} timeDiff=${candidate.timeDiff}`,
        (error, candidate) =>
            `throw existingTransferId=${candidate.existingTransferId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} targetAccountId=${candidate.targetAccountId} amount=${candidate.amount} timeDiff=${candidate.timeDiff} error=${getErrorMessage(error)}`
    )
    async consolidateExistingTransferIncomeDuplicate(candidate: ExistingTransferIncomeDuplicateCandidateInterface): Promise<boolean> {
        return transactionAsync(db, async tx => this.consolidateExistingTransferIncomeDuplicateInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (result, candidate) =>
            `done result=${String(result)} sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate}`,
        (error, candidate) =>
            `throw sourceExpenseTransactionId=${candidate.sourceExpenseTransactionId} bridgeIncomeTransactionId=${candidate.bridgeIncomeTransactionId} bridgeExpenseTransactionId=${candidate.bridgeExpenseTransactionId} targetIncomeTransactionId=${candidate.targetIncomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} sourceAmount=${candidate.sourceAmount} targetAmount=${candidate.targetAmount} exchangeRate=${candidate.exchangeRate} error=${getErrorMessage(error)}`
    )
    async consolidateIbanBridgeChainTransfer(candidate: IbanBridgeChainTransferCandidateInterface): Promise<boolean> {
        return transactionAsync(db, async tx => this.consolidateIbanBridgeChainTransferInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} accountId=${candidate.accountId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} expenseEntryAmount=${candidate.expenseEntryAmount}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} refundIncomeTransactionIds=${candidate.refundIncomeTransactionIds.join(',')} refundsTotal=${candidate.refundsTotal} error=${getErrorMessage(error)}`
    )
    async consolidateRefund(candidate: RefundCandidateInterface): Promise<boolean> {
        return transactionAsync(db, async tx => this.consolidateRefundInner(candidate, tx));
    }

    private computeExchangeRate(candidate: TransferPairCandidateInterface): number {
        if (candidate.confidenceBucket === 'AUTO_SAME_BANK_HINTED_FEE' || candidate.confidenceBucket === 'AUTO_INTERBANK_HINTED_FEE') {
            return 1;
        }

        if (candidate.expenseEntryAmount === candidate.incomeEntryAmount) {
            return 1;
        }

        return candidate.expenseEntryAmount / candidate.incomeEntryAmount;
    }

    private getPairConsolidationType(candidate: TransferPairCandidateInterface): TransactionConsolidationTypeEnum {
        if (candidate.confidenceBucket === 'AUTO_SAME_BANK_HINTED_FEE') {
            return TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER;
        }

        return TransactionConsolidationTypeEnum.TRANSFER_PAIR;
    }

    private async consolidatePairInner(candidate: TransferPairCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];
        const canonicalInput: CanonicalTransferInputInterface = {
            title: candidate.expenseTransactionTitle ?? candidate.incomeTransactionTitle ?? '',
            operatedAt: candidate.operatedAt,
            fromAccountId: candidate.expenseEntryAccountId,
            toAccountId: candidate.incomeEntryAccountId,
            fromAmount: candidate.expenseEntryAmount,
            toAmount: candidate.incomeEntryAmount,
            exchangeRate: this.computeExchangeRate(candidate),
            consolidationType: this.getPairConsolidationType(candidate),
            fromEntryExchangeRate: candidate.expenseEntryExchangeRate,
            toEntryExchangeRate: candidate.incomeEntryExchangeRate,
            fromEntryToIban: candidate.expenseEntryToIban
        };

        return this.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async consolidateAtmCashWithdrawalInner(candidate: AtmCashWithdrawalCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = [candidate.transactionId];
        const canonicalInput: CanonicalTransferInputInterface = {
            title: candidate.transactionTitle ?? '',
            operatedAt: candidate.operatedAt,
            fromAccountId: candidate.sourceAccountId,
            toAccountId: candidate.targetCashAccountId,
            fromAmount: candidate.amount,
            toAmount: candidate.amount,
            exchangeRate: 1,
            consolidationType: TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL,
            fromEntryExchangeRate: 1,
            toEntryExchangeRate: 1,
            fromEntryToIban: null
        };

        return this.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async consolidateRefundInner(candidate: RefundCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];

        if (!(await this.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return false;
        }

        await transactionRepository.setConsolidationType(candidate.expenseTransactionId, TransactionConsolidationTypeEnum.REFUND, tx);
        await this.copySourceTags(candidate.refundIncomeTransactionIds, candidate.expenseTransactionId, tx);
        await this.moveSourcesToCanonical(candidate.refundIncomeTransactionIds, candidate.expenseTransactionId, tx);

        return true;
    }

    private async consolidateIbanBridgeTransferInner(candidate: IbanBridgeTransferCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = this.buildBridgeSourceTransactionIds(candidate);
        const canonicalInput: CanonicalTransferInputInterface = {
            title: candidate.expenseTransactionTitle ?? candidate.incomeTransactionTitle ?? '',
            operatedAt: candidate.operatedAt,
            fromAccountId: candidate.sourceAccountId,
            toAccountId: candidate.targetAccountId,
            fromAmount: candidate.sourceAmount,
            toAmount: candidate.bridgeAmount,
            exchangeRate: candidate.exchangeRate,
            consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
            fromEntryExchangeRate: candidate.exchangeRate,
            toEntryExchangeRate: 1,
            fromEntryToIban: candidate.expenseEntryToIban
        };

        return this.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async consolidateIbanBridgeCanonicalDuplicateInner(
        candidate: IbanBridgeCanonicalDuplicateCandidateInterface,
        tx: DB
    ): Promise<boolean> {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        if (!(await this.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return false;
        }

        await this.copySourceTags(sourceTransactionIds, candidate.existingCanonicalTransferId, tx);
        await this.moveSourcesToCanonical(sourceTransactionIds, candidate.existingCanonicalTransferId, tx);

        return true;
    }

    private async consolidateExistingTransferBridgeInner(candidate: ExistingTransferBridgeCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.existingTransferId
        ];
        const canonicalInput: CanonicalTransferInputInterface = {
            title:
                candidate.existingTransferTitle ?? candidate.sourceExpenseTransactionTitle ?? candidate.bridgeIncomeTransactionTitle ?? '',
            operatedAt: candidate.operatedAt,
            fromAccountId: candidate.sourceAccountId,
            toAccountId: candidate.targetAccountId,
            fromAmount: candidate.sourceAmount,
            toAmount: candidate.targetAmount,
            exchangeRate: candidate.exchangeRate,
            consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
            fromEntryExchangeRate: candidate.exchangeRate,
            toEntryExchangeRate: 1,
            fromEntryToIban: candidate.sourceExpenseEntryToIban
        };

        return this.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async consolidateExistingTransferIncomeDuplicateInner(
        candidate: ExistingTransferIncomeDuplicateCandidateInterface,
        tx: DB
    ): Promise<boolean> {
        const sourceTransactionIds = [candidate.incomeTransactionId];

        if (!(await this.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return false;
        }

        if (!(await this.isExistingTransferStillEligible(candidate.existingTransferId, tx))) {
            return false;
        }

        await transactionRepository.setConsolidationType(candidate.existingTransferId, TransactionConsolidationTypeEnum.TRANSFER_PAIR, tx);
        await this.copySourceTags(sourceTransactionIds, candidate.existingTransferId, tx);
        await this.moveSourcesToCanonical(sourceTransactionIds, candidate.existingTransferId, tx);

        return true;
    }

    private async consolidateIbanBridgeChainTransferInner(candidate: IbanBridgeChainTransferCandidateInterface, tx: DB): Promise<boolean> {
        const sourceTransactionIds = [
            candidate.sourceExpenseTransactionId,
            candidate.bridgeIncomeTransactionId,
            candidate.bridgeExpenseTransactionId,
            candidate.targetIncomeTransactionId
        ];
        const canonicalInput: CanonicalTransferInputInterface = {
            title:
                candidate.bridgeExpenseTransactionTitle ??
                candidate.sourceExpenseTransactionTitle ??
                candidate.targetIncomeTransactionTitle ??
                candidate.bridgeIncomeTransactionTitle ??
                '',
            operatedAt: candidate.operatedAt,
            fromAccountId: candidate.sourceAccountId,
            toAccountId: candidate.targetAccountId,
            fromAmount: candidate.sourceAmount,
            toAmount: candidate.targetAmount,
            exchangeRate: candidate.exchangeRate,
            consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
            fromEntryExchangeRate: candidate.exchangeRate,
            toEntryExchangeRate: 1,
            fromEntryToIban: candidate.sourceExpenseEntryToIban
        };

        return this.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private buildBridgeSourceTransactionIds(candidate: IbanBridgeTransferCandidateInterface): number[] {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        if (isDefined(candidate.existingDirectTransferId)) {
            return [...sourceTransactionIds, candidate.existingDirectTransferId];
        }

        return sourceTransactionIds;
    }

    private async executeConsolidation(
        sourceTransactionIds: number[],
        canonicalInput: CanonicalTransferInputInterface,
        tx: DB
    ): Promise<boolean> {
        if (!(await this.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return false;
        }

        const canonicalTransaction = await this.createCanonicalTransfer(canonicalInput, tx);

        await this.copySourceTags(sourceTransactionIds, canonicalTransaction.id, tx);
        await this.moveSourcesToCanonical(sourceTransactionIds, canonicalTransaction.id, tx);

        return true;
    }

    private async areCandidatesStillEligible(sourceTransactionIds: number[], tx: DB): Promise<boolean> {
        const fresh = await transactionRepository.findByIds(sourceTransactionIds, tx);

        if (fresh.length !== sourceTransactionIds.length) {
            return false;
        }

        if (await transactionEntryRepository.hasMovedSourceEntries(sourceTransactionIds, tx)) {
            return false;
        }

        return fresh.every(transaction => !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt));
    }

    private async isExistingTransferStillEligible(transactionId: number, tx: DB): Promise<boolean> {
        const transaction = await transactionRepository.getByIdRaw(transactionId, tx);

        return isDefined(transaction) && !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt);
    }

    private async createCanonicalTransfer(input: CanonicalTransferInputInterface, tx: DB): Promise<TransactionEntityInterface> {
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

    private async moveSourcesToCanonical(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        await transactionEntryRepository.moveToConsolidatedTransaction(sourceTransactionIds, canonicalTransactionId, tx);
        await transactionRepository.setConsolidationParent(sourceTransactionIds, canonicalTransactionId, tx);
    }

    private async copySourceTags(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        const sourceTags = await this.findSourceTags(sourceTransactionIds, tx);
        const uniqueTagIds = [...new Set(sourceTags.map(tag => tag.tagId))];

        if (isEmptyArray(uniqueTagIds)) {
            return;
        }

        await transactionTagsRepository.bulkCreate(
            uniqueTagIds.map(tagId => ({
                transactionId: canonicalTransactionId,
                tagId,
                isPrimary: false
            })),
            tx
        );
    }

    private async findSourceTags(sourceTransactionIds: number[], tx: DB): Promise<TransactionTagsEntityInterface[]> {
        if (!isNotEmptyArray(sourceTransactionIds)) {
            return [];
        }

        const tagCollections = await Promise.all(
            sourceTransactionIds.map(async transactionId => transactionTagsRepository.findByTransactionId(transactionId, tx))
        );

        return tagCollections.flat();
    }
}

export const transferConsolidationExecutorService = new TransferConsolidationExecutorService();
