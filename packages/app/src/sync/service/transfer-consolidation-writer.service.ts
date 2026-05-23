import { TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type { DB, TransactionEntityInterface, TransactionTagsEntityInterface } from '@budgie/contracts';

class TransferConsolidationWriterService {
    async executeConsolidation(sourceTransactionIds: number[], canonicalInput: CanonicalTransferInputInterface, tx: DB): Promise<void> {
        if (!(await this.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return;
        }

        const canonicalTransaction = await this.createCanonicalTransfer(canonicalInput, tx);

        await this.copySourceTags(sourceTransactionIds, canonicalTransaction.id, tx);
        await this.moveSourcesToCanonical(sourceTransactionIds, canonicalTransaction.id, tx);
    }

    async areCandidatesStillEligible(sourceTransactionIds: number[], tx: DB): Promise<boolean> {
        const fresh = await transactionRepository.findByIds(sourceTransactionIds, tx);

        if (fresh.length !== sourceTransactionIds.length) {
            return false;
        }

        return fresh.every(transaction => !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt));
    }

    async isExistingTransferStillEligible(transactionId: number, tx: DB): Promise<boolean> {
        const transaction = await transactionRepository.getById(transactionId, tx);

        return isDefined(transaction) && !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt);
    }

    async moveSourcesToCanonical(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        await transactionEntryRepository.moveToConsolidatedTransaction(sourceTransactionIds, canonicalTransactionId, tx);
        await transactionRepository.setConsolidationParent(sourceTransactionIds, canonicalTransactionId, tx);
    }

    async copySourceTags(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
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

export const transferConsolidationWriterService = new TransferConsolidationWriterService();
