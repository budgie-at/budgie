/* eslint-disable lingui/no-unlocalized-strings */
import { TransactionTypeEnum, TransferPairCandidateInterface } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isNotEmptyArray } from '@rnw-community/shared';

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

class TransferConsolidationService {
    private isRunning = false;

    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(TRANSFER_CONSOLIDATION_TASK)) {
            return;
        }

        TaskManager.defineTask(TRANSFER_CONSOLIDATION_TASK, () => this.consolidate());
        await BackgroundTask.registerTaskAsync(TRANSFER_CONSOLIDATION_TASK, {
            minimumInterval: THIRTY_MINUTES_IN_SECONDS
        });
    }

    async consolidate(): Promise<BackgroundTask.BackgroundTaskResult> {
        if (this.isRunning) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        this.isRunning = true;

        try {
            const pairCandidates = await transferPairRepository.findCandidates();

            for (const candidate of pairCandidates) {
                try {
                    await this.consolidatePair(candidate);
                } catch {
                    // Consolidation failed, skip this pair
                } finally {
                    await accountBalanceIncrementalService.updateAllBalances(true);
                }
            }

            return BackgroundTask.BackgroundTaskResult.Success;
        } catch {
            return BackgroundTask.BackgroundTaskResult.Failed;
        } finally {
            this.isRunning = false;
        }
    }

    private async consolidatePair(candidate: TransferPairCandidateInterface): Promise<void> {
        await db.transaction(async tx => {
            const incomeTags = await transactionTagsRepository.findByTransactionId(candidate.income_transaction_id);

            const existingComment = candidate.expense_transaction_comment ?? '';
            const incomeTitle = candidate.income_transaction_title ?? '';
            const consolidationNote = `[Automatically consolidated from: ${incomeTitle}]`;
            const updatedComment = existingComment ? `${existingComment}\n${consolidationNote}` : consolidationNote;

            await transactionRepository.updateById(
                candidate.expense_transaction_id,
                {
                    type: TransactionTypeEnum.TRANSFER,
                    toAccountId: candidate.income_entry_account_id,
                    exchangeRate:
                        candidate.income_entry_exchange_rate === 1
                            ? candidate.expense_entry_exchange_rate
                            : candidate.income_entry_exchange_rate,
                    comment: updatedComment
                },
                tx
            );

            await transactionEntryRepository.updateById(
                candidate.income_entry_id,
                {
                    transactionId: candidate.expense_transaction_id,
                    categoryId: null
                },
                tx
            );

            await transactionEntryRepository.updateById(
                candidate.expense_entry_id,
                {
                    categoryId: null
                },
                tx
            );

            if (isNotEmptyArray(incomeTags)) {
                await transactionTagsRepository.bulkCreate(
                    incomeTags.map(tag => ({
                        transactionId: candidate.expense_transaction_id,
                        tagId: tag.tagId
                    })),
                    tx
                );
            }

            await transactionRepository.deleteById(candidate.income_transaction_id, tx);
            await transactionTagsRepository.deleteByTransactionId(candidate.income_transaction_id, tx);
        });
    }
}

export const transferConsolidationService = new TransferConsolidationService();
