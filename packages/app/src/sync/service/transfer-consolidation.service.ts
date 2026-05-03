/* eslint-disable max-lines -- Consolidation orchestration owns multiple candidate execution paths */
import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import {
    db,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository,
    transferPairRepository
} from '../../@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { THIRTY_MINUTES_IN_SECONDS } from '../constant/time.constant';
import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type { ConsolidationPreviewInterface } from '../interface/consolidation-preview.interface';
import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    AtmCashWithdrawalReviewCandidateInterface,
    DB,
    IbanBridgeTransferCandidateInterface,
    TransactionEntityInterface,
    TransactionTagsEntityInterface,
    TransferPairCandidateInterface,
    TransferPairReviewCandidateInterface
} from '@budgie/contracts';

class TransferConsolidationService {
    private isRunning = false;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(TRANSFER_CONSOLIDATION_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(TRANSFER_CONSOLIDATION_TASK, {
            minimumInterval: THIRTY_MINUTES_IN_SECONDS
        });
    }

    @Log(
        'enter',
        result => `done autoCandidateCount=${result.autoCandidateCount} manualReviewCandidateCount=${result.manualReviewCandidateCount}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async preview(): Promise<ConsolidationPreviewInterface> {
        const pairCandidates = await this.findPairCandidates();
        const manualReviewCandidates = await this.findManualReviewCandidates();
        const atmCashWithdrawalCandidates = await this.findAtmCashWithdrawalCandidates();
        const atmCashWithdrawalReviewCandidates = await this.findAtmCashWithdrawalReviewCandidates();
        const ibanBridgeTransferCandidates = await this.findIbanBridgeTransferCandidates();

        return {
            autoCandidateCount: pairCandidates.length + atmCashWithdrawalCandidates.length + ibanBridgeTransferCandidates.length,
            manualReviewCandidateCount: manualReviewCandidates.length + atmCashWithdrawalReviewCandidates.length
        };
    }

    @Log(
        'enter',
        result => `done found=${result.found} consolidated=${result.consolidated}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async consolidate(): Promise<ConsolidationResultInterface> {
        if (this.isRunning) {
            return { found: 0, consolidated: 0 };
        }

        this.isRunning = true;

        try {
            return await this.runConsolidation();
        } finally {
            this.isRunning = false;
        }
    }

    @Log(
        candidates =>
            `enter buckets=${candidates.map(candidate => candidate.confidenceBucket).join(',')} expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')}`,
        (result, candidates) =>
            `done buckets=${candidates.map(candidate => candidate.confidenceBucket).join(',')} expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw buckets=${candidates.map(candidate => candidate.confidenceBucket).join(',')} expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} error=${getErrorMessage(error)}`
    )
    private async processPairCandidates(candidates: TransferPairCandidateInterface[]): Promise<number> {
        return candidates.reduce(async (consolidatedPromise, candidate) => {
            const consolidated = await consolidatedPromise;
            const success = await this.consolidatePair(candidate).then(
                () => true,
                () => false
            );

            return success ? consolidated + 1 : consolidated;
        }, Promise.resolve(0));
    }

    @Log(
        candidates =>
            `enter transactionIds=${candidates.map(candidate => candidate.transactionId).join(',')} targetCashAccountIds=${candidates.map(candidate => candidate.targetCashAccountId).join(',')}`,
        (result, candidates) =>
            `done transactionIds=${candidates.map(candidate => candidate.transactionId).join(',')} targetCashAccountIds=${candidates.map(candidate => candidate.targetCashAccountId).join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw transactionIds=${candidates.map(candidate => candidate.transactionId).join(',')} targetCashAccountIds=${candidates.map(candidate => candidate.targetCashAccountId).join(',')} error=${getErrorMessage(error)}`
    )
    private async processAtmCashWithdrawalCandidates(candidates: AtmCashWithdrawalCandidateInterface[]): Promise<number> {
        return candidates.reduce(async (consolidatedPromise, candidate) => {
            const consolidated = await consolidatedPromise;
            const success = await this.consolidateAtmCashWithdrawal(candidate).then(
                () => true,
                () => false
            );

            return success ? consolidated + 1 : consolidated;
        }, Promise.resolve(0));
    }

    @Log(
        candidates =>
            `enter expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} existingDirectTransferIds=${candidates.map(candidate => candidate.existingDirectTransferId ?? '').join(',')}`,
        (result, candidates) =>
            `done expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} existingDirectTransferIds=${candidates.map(candidate => candidate.existingDirectTransferId ?? '').join(',')} consolidated=${result}`,
        (error, candidates) =>
            `throw expenseTransactionIds=${candidates.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${candidates.map(candidate => candidate.incomeTransactionId).join(',')} existingDirectTransferIds=${candidates.map(candidate => candidate.existingDirectTransferId ?? '').join(',')} error=${getErrorMessage(error)}`
    )
    private async processIbanBridgeTransferCandidates(candidates: IbanBridgeTransferCandidateInterface[]): Promise<number> {
        return candidates.reduce(async (consolidatedPromise, candidate) => {
            const consolidated = await consolidatedPromise;
            const success = await this.consolidateIbanBridgeTransfer(candidate).then(
                () => true,
                () => false
            );

            return success ? consolidated + 1 : consolidated;
        }, Promise.resolve(0));
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} matchType=${candidate.matchType} bucket=${candidate.confidenceBucket} timeDiff=${candidate.timeDiff} error=${getErrorMessage(error)}`
    )
    private async consolidatePair(candidate: TransferPairCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidatePairInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount}`,
        (result, candidate) =>
            `done result=${String(result)} transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount}`,
        (error, candidate) =>
            `throw transactionId=${candidate.transactionId} sourceAccountId=${candidate.sourceAccountId} targetCashAccountId=${candidate.targetCashAccountId} amount=${candidate.amount} error=${getErrorMessage(error)}`
    )
    private async consolidateAtmCashWithdrawal(candidate: AtmCashWithdrawalCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidateAtmCashWithdrawalInner(candidate, tx));
    }

    @Log(
        candidate =>
            `enter expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''}`,
        (result, candidate) =>
            `done result=${String(result)} expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''}`,
        (error, candidate) =>
            `throw expenseTransactionId=${candidate.expenseTransactionId} incomeTransactionId=${candidate.incomeTransactionId} sourceAccountId=${candidate.sourceAccountId} bridgeAccountId=${candidate.bridgeAccountId} targetAccountId=${candidate.targetAccountId} bridgeAmount=${candidate.bridgeAmount} exchangeRate=${candidate.exchangeRate} existingDirectTransferId=${candidate.existingDirectTransferId ?? ''} error=${getErrorMessage(error)}`
    )
    private async consolidateIbanBridgeTransfer(candidate: IbanBridgeTransferCandidateInterface): Promise<void> {
        await transactionAsync(db, async tx => this.consolidateIbanBridgeTransferInner(candidate, tx));
    }

    @Log(
        'enter',
        result => `done found=${result.found} consolidated=${result.consolidated}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async runConsolidation(): Promise<ConsolidationResultInterface> {
        const candidates = await this.findConsolidationCandidateGroups();
        const pairConsolidated = await this.processPairCandidates(candidates.pairCandidates);
        const bridgeConsolidated = await this.processIbanBridgeTransferCandidates(candidates.ibanBridgeTransferCandidates);
        const atmConsolidated = await this.processAtmCashWithdrawalCandidates(candidates.atmCashWithdrawalCandidates);
        const consolidated = pairConsolidated + bridgeConsolidated + atmConsolidated;

        if (isPositiveNumber(consolidated)) {
            await accountBalanceIncrementalService.updateAllBalances(true);
        }

        const result = {
            found:
                candidates.pairCandidates.length +
                candidates.ibanBridgeTransferCandidates.length +
                candidates.atmCashWithdrawalCandidates.length,
            consolidated
        };

        return result;
    }

    @Log(
        'enter',
        result =>
            `done manualExpenseTransactionIds=${result.manualReviewCandidates.map(candidate => candidate.expenseTransactionId).join(',')} atmReviewTransactionIds=${result.atmCashWithdrawalReviewCandidates.map(candidate => candidate.transactionId).join(',')} pairExpenseTransactionIds=${result.pairCandidates.map(candidate => candidate.expenseTransactionId).join(',')} ibanBridgeExpenseTransactionIds=${result.ibanBridgeTransferCandidates.map(candidate => candidate.expenseTransactionId).join(',')} atmTransactionIds=${result.atmCashWithdrawalCandidates.map(candidate => candidate.transactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findConsolidationCandidateGroups(): Promise<ConsolidationCandidateGroupsInterface> {
        const manualReviewCandidates = await this.findManualReviewCandidates();
        const atmCashWithdrawalReviewCandidates = await this.findAtmCashWithdrawalReviewCandidates();
        const pairCandidates = await this.findPairCandidates();
        const ibanBridgeTransferCandidates = await this.findIbanBridgeTransferCandidates();
        const atmCashWithdrawalCandidates = await this.findAtmCashWithdrawalCandidates();

        return {
            manualReviewCandidates,
            atmCashWithdrawalReviewCandidates,
            pairCandidates,
            ibanBridgeTransferCandidates,
            atmCashWithdrawalCandidates
        };
    }

    @Log(
        'enter',
        result => `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findPairCandidates(): Promise<TransferPairCandidateInterface[]> {
        return transferPairRepository.findCandidates();
    }

    @Log(
        'enter',
        result => `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findManualReviewCandidates(): Promise<TransferPairReviewCandidateInterface[]> {
        return transferPairRepository.findManualReviewCandidates();
    }

    @Log(
        'enter',
        result => `done transactionIds=${result.map(candidate => candidate.transactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findAtmCashWithdrawalCandidates(): Promise<AtmCashWithdrawalCandidateInterface[]> {
        return transferPairRepository.findAtmCashWithdrawalCandidates();
    }

    @Log(
        'enter',
        result => `done transactionIds=${result.map(candidate => candidate.transactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findAtmCashWithdrawalReviewCandidates(): Promise<AtmCashWithdrawalReviewCandidateInterface[]> {
        return transferPairRepository.findAtmCashWithdrawalReviewCandidates();
    }

    @Log(
        'enter',
        result => `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async findIbanBridgeTransferCandidates(): Promise<IbanBridgeTransferCandidateInterface[]> {
        return transferPairRepository.findIbanBridgeTransferCandidates();
    }

    private computeExchangeRate(candidate: TransferPairCandidateInterface): number {
        if (candidate.expenseEntryAmount === candidate.incomeEntryAmount) {
            return 1;
        }

        return candidate.expenseEntryAmount / candidate.incomeEntryAmount;
    }

    private async consolidatePairInner(candidate: TransferPairCandidateInterface, tx: DB): Promise<void> {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];
        const canonicalInput: CanonicalTransferInputInterface = {
            title: candidate.expenseTransactionTitle ?? candidate.incomeTransactionTitle ?? '',
            operatedAt: candidate.operatedAt,
            fromAccountId: candidate.expenseEntryAccountId,
            toAccountId: candidate.incomeEntryAccountId,
            fromAmount: candidate.expenseEntryAmount,
            toAmount: candidate.incomeEntryAmount,
            exchangeRate: this.computeExchangeRate(candidate),
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            fromEntryExchangeRate: candidate.expenseEntryExchangeRate,
            toEntryExchangeRate: candidate.incomeEntryExchangeRate,
            fromEntryToIban: candidate.expenseEntryToIban
        };

        await this.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async consolidateAtmCashWithdrawalInner(candidate: AtmCashWithdrawalCandidateInterface, tx: DB): Promise<void> {
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

        await this.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async consolidateIbanBridgeTransferInner(candidate: IbanBridgeTransferCandidateInterface, tx: DB): Promise<void> {
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

        await this.executeConsolidation(sourceTransactionIds, canonicalInput, tx);
    }

    private async executeConsolidation(
        sourceTransactionIds: number[],
        canonicalInput: CanonicalTransferInputInterface,
        tx: DB
    ): Promise<void> {
        if (!(await this.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return;
        }

        const canonicalTransaction = await this.createCanonicalTransfer(canonicalInput, tx);

        await this.copySourceTags(sourceTransactionIds, canonicalTransaction.id, tx);
        await this.moveSourcesToCanonical(sourceTransactionIds, canonicalTransaction.id, tx);
    }

    private async areCandidatesStillEligible(sourceTransactionIds: number[], tx: DB): Promise<boolean> {
        const fresh = await transactionRepository.findByIds(sourceTransactionIds, tx);

        if (fresh.length !== sourceTransactionIds.length) {
            return false;
        }

        return fresh.every(transaction => !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt));
    }

    private buildBridgeSourceTransactionIds(candidate: IbanBridgeTransferCandidateInterface): number[] {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        if (isDefined(candidate.existingDirectTransferId)) {
            return [...sourceTransactionIds, candidate.existingDirectTransferId];
        }

        return sourceTransactionIds;
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
                consolidationParentTransactionId: null
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
            sourceTransactionIds.map(async id => transactionTagsRepository.findByTransactionId(id, tx))
        );

        return tagCollections.flat();
    }
}

export const transferConsolidationService = new TransferConsolidationService();
