import { TransactionTypeEnum, TransferPairCandidateInterface, TransitiveEntryCandidateInterface } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isNotEmptyArray } from '@rnw-community/shared';

import {
    db,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository,
    transferPairRepository,
    transitiveEntryRepository
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

    // eslint-disable-next-line max-statements -- Service orchestration method coordinating multiple async operations
    async consolidate(): Promise<ConsolidationResultInterface> {
        if (this.isRunning) {
            return { found: 0, consolidated: 0, transitiveFound: 0, transitiveAttached: 0 };
        }

        this.isRunning = true;

        try {
            const pairCandidates = await transferPairRepository.findCandidates();
            const consolidated = await this.processCandidates(pairCandidates);

            const transitiveCandidates = await transitiveEntryRepository.findCandidates();
            const transitiveAttached = await this.processTransitiveCandidates(transitiveCandidates);

            const hasChanges = consolidated > 0 || transitiveAttached > 0;
            if (hasChanges) {
                await accountBalanceIncrementalService.updateAllBalances(true);
            }

            return {
                found: pairCandidates.length,
                consolidated,
                transitiveFound: transitiveCandidates.length,
                transitiveAttached
            };
        } catch {
            return { found: 0, consolidated: 0, transitiveFound: 0, transitiveAttached: 0 };
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

        return consolidated;
    }

    private async processTransitiveCandidates(candidates: TransitiveEntryCandidateInterface[]): Promise<number> {
        let attached = 0;

        for (const candidate of candidates) {
            const success = await this.tryAttachTransitiveEntries(candidate);
            if (success) {
                attached += 1;
            }
        }

        return attached;
    }

    private async tryAttachTransitiveEntries(candidate: TransitiveEntryCandidateInterface): Promise<boolean> {
        try {
            await this.attachTransitiveEntries(candidate);

            return true;
        } catch {
            return false;
        }
    }

    private async attachTransitiveEntries(candidate: TransitiveEntryCandidateInterface): Promise<void> {
        await db.transaction(async tx => {
            const incomeTransactionTags = await transactionTagsRepository.findByTransactionId(candidate.transitive_income_transaction_id);
            const expenseTransactionTags = await transactionTagsRepository.findByTransactionId(candidate.transitive_expense_transaction_id);

            await transactionEntryRepository.updateById(
                candidate.transitive_income_entry_id,
                {
                    transactionId: candidate.transfer_transaction_id,
                    categoryId: null
                },
                tx
            );

            await transactionEntryRepository.updateById(
                candidate.transitive_expense_entry_id,
                {
                    transactionId: candidate.transfer_transaction_id,
                    categoryId: null
                },
                tx
            );

            const allTags = [...incomeTransactionTags, ...expenseTransactionTags];
            if (isNotEmptyArray(allTags)) {
                await transactionTagsRepository.bulkCreate(
                    allTags.map(tag => ({
                        transactionId: candidate.transfer_transaction_id,
                        tagId: tag.tagId
                    })),
                    tx
                );
            }

            await transactionRepository.deleteById(candidate.transitive_income_transaction_id, tx);
            await transactionTagsRepository.deleteByTransactionId(candidate.transitive_income_transaction_id, tx);
            await transactionRepository.deleteById(candidate.transitive_expense_transaction_id, tx);
            await transactionTagsRepository.deleteByTransactionId(candidate.transitive_expense_transaction_id, tx);
        });
    }

    private async tryConsolidatePair(candidate: TransferPairCandidateInterface): Promise<boolean> {
        try {
            await this.consolidatePair(candidate);

            return true;
        } catch {
            return false;
        }
    }

    private async consolidatePair(candidate: TransferPairCandidateInterface): Promise<void> {
        await db.transaction(async tx => {
            const incomeTags = await transactionTagsRepository.findByTransactionId(candidate.income_transaction_id);

            const existingComment = candidate.expense_transaction_comment ?? '';
            const incomeTitle = candidate.income_transaction_title ?? '';
            const consolidationNote = `[Automatically consolidated from: ${incomeTitle}]`; // eslint-disable-line lingui/no-unlocalized-strings
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
