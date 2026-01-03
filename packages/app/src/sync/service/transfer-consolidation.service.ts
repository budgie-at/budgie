/* eslint-disable no-await-in-loop,lingui/no-unlocalized-strings,max-statements */
import {
    ExternalSourceEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    bankSyncRepository,
    db,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';

interface TransferPair {
    incomeTransaction: TransactionWithRelationsEntityInterface;
    expenseTransaction: TransactionWithRelationsEntityInterface;
    fromAccountId: number;
    toAccountId: number;
    expenseAmount: number;
    incomeAmount: number;
    exchangeRate: number;
}

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const THIRTY_MINUTES_IN_SECONDS = 30 * 60;

class TransferConsolidationService {
    private isRunning = false;

    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(TRANSFER_CONSOLIDATION_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(TRANSFER_CONSOLIDATION_TASK, {
            minimumInterval: THIRTY_MINUTES_IN_SECONDS
        });
    }

    async consolidate(provider: ExternalSourceEnum): Promise<BackgroundTask.BackgroundTaskResult> {
        if (this.isRunning) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        this.isRunning = true;

        try {
            await this.executeConsolidation(provider);

            return BackgroundTask.BackgroundTaskResult.Success;
        } catch {
            return BackgroundTask.BackgroundTaskResult.Failed;
        } finally {
            this.isRunning = false;
        }
    }

    private async executeConsolidation(provider: ExternalSourceEnum): Promise<void> {
        const syncedAccountIds = await this.getSyncedAccountIds(provider);
        if (!isNotEmptyArray(syncedAccountIds)) {
            return;
        }

        const candidates = await transactionRepository.findIncomeExpenseByExternalSource(provider);
        const pairs = this.findMatchingPairs(candidates, new Set(syncedAccountIds));

        for (const pair of pairs) {
            await this.consolidatePair(pair, provider);
        }
    }

    private async getSyncedAccountIds(provider: ExternalSourceEnum): Promise<number[]> {
        const syncs = await bankSyncRepository.getByProvider(provider);

        return syncs.map(sync => sync.accountId);
    }

    private findMatchingPairs(
        transactions: TransactionWithRelationsEntityInterface[],
        syncedAccountIds: Set<number>
    ): TransferPair[] {
        const usedIds = new Set<number>();
        const pairs: TransferPair[] = [];

        const incomeTransactions = transactions.filter(
            tx => tx.type === TransactionTypeEnum.INCOME && isDefined(tx.toAccountId) && syncedAccountIds.has(tx.toAccountId)
        );

        const expenseTransactions = transactions.filter(
            tx => tx.type === TransactionTypeEnum.EXPENSE && isDefined(tx.fromAccountId) && syncedAccountIds.has(tx.fromAccountId)
        );

        for (const income of incomeTransactions) {
            if (usedIds.has(income.id) || !isDefined(income.toAccountId)) {
                // eslint-disable-next-line no-continue
                continue;
            }

            const pair = this.findMatchingExpense(income, expenseTransactions, usedIds);
            if (isDefined(pair)) {
                pairs.push(pair);
                usedIds.add(income.id);
                usedIds.add(pair.expenseTransaction.id);
            }
        }

        return pairs;
    }

    private findMatchingExpense(
        income: TransactionWithRelationsEntityInterface,
        expenseTransactions: TransactionWithRelationsEntityInterface[],
        usedIds: Set<number>
    ): TransferPair | null {
        const incomeAccountId = income.toAccountId;
        const incomeAmount = this.getTransactionAmount(income);
        const incomeTime = new Date(income.operatedAt).getTime();

        if (!isDefined(incomeAccountId)) {
            return null;
        }

        for (const expense of expenseTransactions) {
            if (usedIds.has(expense.id) || !isDefined(expense.fromAccountId)) {
                // eslint-disable-next-line no-continue
                continue;
            }

            const expenseAccountId = expense.fromAccountId;
            if (expenseAccountId === incomeAccountId) {
                // eslint-disable-next-line no-continue
                continue;
            }

            const expenseTime = new Date(expense.operatedAt).getTime();
            if (Math.abs(incomeTime - expenseTime) > FIFTEEN_MINUTES_MS) {
                // eslint-disable-next-line no-continue
                continue;
            }

            const expenseAmount = this.getTransactionAmount(expense);
            const exchangeRate = this.calculateExchangeRate(incomeAmount, expenseAmount, income, expense);

            if (isDefined(exchangeRate)) {
                return {
                    incomeTransaction: income,
                    expenseTransaction: expense,
                    fromAccountId: expenseAccountId,
                    toAccountId: incomeAccountId,
                    expenseAmount,
                    incomeAmount,
                    exchangeRate
                };
            }
        }

        return null;
    }

    private getTransactionAmount(transaction: TransactionWithRelationsEntityInterface): number {
        const [entry] = transaction.entries;

        return isDefined(entry) ? entry.amount : 0;
    }

    private calculateExchangeRate(
        incomeAmount: number,
        expenseAmount: number,
        income: TransactionWithRelationsEntityInterface,
        expense: TransactionWithRelationsEntityInterface
    ): number | null {
        if (incomeAmount === 0 || expenseAmount === 0) {
            return null;
        }

        const [incomeEntry] = income.entries;
        const [expenseEntry] = expense.entries;

        const incomeInstrumentId = isDefined(incomeEntry) ? incomeEntry.account.instrumentId : null;
        const expenseInstrumentId = isDefined(expenseEntry) ? expenseEntry.account.instrumentId : null;

        if (incomeInstrumentId === expenseInstrumentId) {
            return incomeAmount === expenseAmount ? 1 : null;
        }

        return incomeAmount / expenseAmount;
    }

    private async consolidatePair(pair: TransferPair, provider: ExternalSourceEnum): Promise<void> {
        await db.transaction(async tx => {
            await this.deleteTransaction(pair.incomeTransaction.id, tx);
            await this.deleteTransaction(pair.expenseTransaction.id, tx);

            await this.createTransferTransaction(pair, provider, tx);

            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        });
    }

    private async deleteTransaction(transactionId: number, tx: Transaction): Promise<void> {
        await transactionRepository.deleteById(transactionId, tx);
        await transactionEntryRepository.deleteByTransactionId(transactionId, tx);
        await transactionTagsRepository.deleteByTransactionId(transactionId, tx);
    }

    private async createTransferTransaction(pair: TransferPair, provider: ExternalSourceEnum, tx: Transaction): Promise<void> {
        const [expenseEntry] = pair.expenseTransaction.entries;
        const [incomeEntry] = pair.incomeTransaction.entries;

        const transferTransaction = await transactionRepository.create(
            {
                type: TransactionTypeEnum.TRANSFER,
                title: pair.expenseTransaction.title,
                comment: this.buildAuditComment(pair),
                fromAccountId: pair.fromAccountId,
                toAccountId: pair.toAccountId,
                operatedAt: pair.expenseTransaction.operatedAt,
                exchangeRate: pair.exchangeRate,
                externalId: pair.expenseTransaction.externalId,
                externalSource: provider
            },
            tx
        );

        const expenseMccCategoryId = isDefined(expenseEntry) ? expenseEntry.mccCategoryId : null;
        const expenseExternalId = isDefined(expenseEntry) ? expenseEntry.externalId : null;
        const incomeMccCategoryId = isDefined(incomeEntry) ? incomeEntry.mccCategoryId : null;
        const incomeExternalId = isDefined(incomeEntry) ? incomeEntry.externalId : null;

        await transactionEntryRepository.bulkCreate(
            [
                {
                    transactionId: transferTransaction.id,
                    accountId: pair.fromAccountId,
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: pair.expenseAmount,
                    categoryId: null,
                    mccCategoryId: expenseMccCategoryId,
                    externalId: expenseExternalId
                },
                {
                    transactionId: transferTransaction.id,
                    accountId: pair.toAccountId,
                    type: TransactionEntryTypeEnum.DEBIT,
                    amount: pair.incomeAmount,
                    categoryId: null,
                    mccCategoryId: incomeMccCategoryId,
                    externalId: incomeExternalId
                }
            ],
            tx
        );
    }

    private buildAuditComment(pair: TransferPair): string {
        const expenseExtId = pair.expenseTransaction.externalId ?? 'unknown';
        const incomeExtId = pair.incomeTransaction.externalId ?? 'unknown';

        return `Consolidated: ${expenseExtId}, ${incomeExtId}`;
    }
}

export const transferConsolidationService = new TransferConsolidationService();
