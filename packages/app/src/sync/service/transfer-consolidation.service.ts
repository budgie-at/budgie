import { TransactionTypeEnum, TransferPairCandidateInterface } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

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
import { ConsolidationResultInterface } from '../interface/consolidation-result.interface';

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

    async consolidate(): Promise<ConsolidationResultInterface> {
        if (this.isRunning) {
            return { found: 0, consolidated: 0 };
        }

        this.isRunning = true;

        try {
            const pairCandidates = await transferPairRepository.findCandidates();
            const consolidated = await this.processCandidates(pairCandidates);

            return {
                found: pairCandidates.length,
                consolidated
            };
        } catch (error: unknown) {
            // eslint-disable-next-line no-console
            console.log(getErrorMessage(error));

            return { found: 0, consolidated: 0 };
        } finally {
            this.isRunning = false;
        }
    }

    private async processCandidates(candidates: TransferPairCandidateInterface[]): Promise<number> {
        let consolidated = 0;

        for (const candidate of candidates) {
            const success = await this.tryConsolidatePair(candidate);
            if (success) {
                consolidated += 1;
            }
        }

        if (isPositiveNumber(consolidated)) {
            await accountBalanceIncrementalService.updateAllBalances(true);
        }

        return consolidated;
    }

    private async tryConsolidatePair(candidate: TransferPairCandidateInterface): Promise<boolean> {
        try {
            await this.consolidatePair(candidate);

            return true;
        } catch (error: unknown) {
            // eslint-disable-next-line no-console
            console.log(getErrorMessage(error));

            return false;
        }
    }

    private async consolidatePair(candidate: TransferPairCandidateInterface): Promise<void> {
        // eslint-disable-next-line max-statements -- Consolidation requires multiple sequential DB operations
        await db.transaction(async tx => {
            const [incomeTags, expenseTags] = await Promise.all([
                transactionTagsRepository.findByTransactionId(candidate.income_transaction_id, tx),
                transactionTagsRepository.findByTransactionId(candidate.expense_transaction_id, tx)
            ]);

            const existingComment = candidate.expense_transaction_comment ?? '';
            const incomeTitle = candidate.income_transaction_title ?? '';
            const consolidationNote = `[Automatically consolidated from: ${incomeTitle}]`; // eslint-disable-line lingui/no-unlocalized-strings
            const updatedComment = existingComment ? `${existingComment}\n${consolidationNote}` : consolidationNote;

            const exchangeRate = this.computeExchangeRate(candidate);

            await transactionRepository.updateById(
                candidate.expense_transaction_id,
                {
                    type: TransactionTypeEnum.TRANSFER,
                    toAccountId: candidate.income_entry_account_id,
                    exchangeRate,
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

            const existingTagIds = new Set(expenseTags.map(tag => tag.tagId));
            const newIncomeTags = incomeTags.filter(tag => !existingTagIds.has(tag.tagId));

            if (isNotEmptyArray(newIncomeTags)) {
                await transactionTagsRepository.bulkCreate(
                    newIncomeTags.map(tag => ({
                        transactionId: candidate.expense_transaction_id,
                        tagId: tag.tagId
                    })),
                    tx
                );
            }

            await transactionTagsRepository.deleteByTransactionId(candidate.income_transaction_id, tx);
            await transactionRepository.deleteById(candidate.income_transaction_id, tx);
        });
    }

    private computeExchangeRate(candidate: TransferPairCandidateInterface): number {
        if (candidate.expense_entry_amount === candidate.income_entry_amount) {
            return 1;
        }

        return candidate.income_entry_amount / candidate.expense_entry_amount;
    }
}

export const transferConsolidationService = new TransferConsolidationService();
