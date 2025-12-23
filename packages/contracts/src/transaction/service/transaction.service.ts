import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { DB, Transaction } from '../../@generic/type/db.type';
import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/util/process-input-with-batches.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryRepository } from '../../transaction-entry/repository/transaction-entry.repository';
import { TransactionTagsRepository } from '../../transaction-tags/repository/transaction-tags.repository';
import { TransactionEntityInterface } from '../entity/transaction-entity.interface';
import { TransactionRepository } from '../repository/transaction.repository';
import { TransactionCreateInputInterface } from '../input/transaction-create-input.interface';

export class TransactionService {
    transactionRepository: TransactionRepository;
    transactionTagsRepository: TransactionTagsRepository;
    transactionEntryRepository: TransactionEntryRepository;

    constructor(private readonly db: DB) {
        this.transactionRepository = new TransactionRepository(db);
        this.transactionTagsRepository = new TransactionTagsRepository(db);
        this.transactionEntryRepository = new TransactionEntryRepository(db);
    }

    async createInternal(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        const [transaction] = await this.bulkCreate([input]);

        return transaction;
    }

    async bulkCreate(inputs: TransactionCreateInputInterface[], batchSize = 500): Promise<TransactionEntityInterface[]> {
        return await processInputWithBatches(inputs, batchSize, this.processBatch.bind(this));
    }

    async createInternalTransfer(input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        return await this.db.transaction(async tx => {
            const fromEntry = input.entries.find(({ accountId }) => accountId === input.fromAccountId);
            const toEntry = input.entries.find(({ accountId }) => accountId === input.toAccountId);

            if (!isDefined(fromEntry) || !isDefined(toEntry)) {
                throw new Error('Transfer must have exactly two entries');
            }

            const fromAmount = convertToMicroUnits(fromEntry.amount);
            const toAmount = convertToMicroUnits(toEntry.amount);

            const transaction = await this.transactionRepository.create(
                {
                    ...input,
                    externalId: null,
                    externalSource: null,
                    exchangeRate: 1
                    // exchangeRate: fromEntry.instrumentId === toEntry.instrumentId ? 1 : toAmount / fromAmount
                },
                tx
            );

            await this.transactionEntryRepository.create(
                {
                    ...fromEntry,
                    amount: fromAmount,
                    transactionId: transaction.id,
                    type: TransactionEntryTypeEnum.CREDIT
                },
                tx
            );

            await this.transactionEntryRepository.create(
                {
                    ...toEntry,
                    amount: toAmount,
                    transactionId: transaction.id,
                    type: TransactionEntryTypeEnum.DEBIT
                },
                tx
            );

            if (isNotEmptyArray(input.tagIds)) {
                await this.transactionTagsRepository.bulkCreate(
                    input.tagIds.map(tagId => ({ transactionId: transaction.id, tagId })),
                    tx
                );
            }

            return transaction;
        });
    }

    async updateById(id: number, input: TransactionCreateInputInterface): Promise<TransactionEntityInterface> {
        return await this.db.transaction(async tx => {
            const transaction = await this.transactionRepository.updateById(id, input, tx);

            await this.upsertEntriesAndTags(id, input, tx);

            return transaction;
        });
    }

    private processBatch(batch: TransactionCreateInputInterface[]): Promise<TransactionEntityInterface[]> {
        return this.db.transaction(async tx => {
            const preparedInputs = batch.map(input => ({
                ...input,
                amount: convertToMicroUnits(input.amount)
            }));

            const transactions = await this.transactionRepository.bulkCreate(preparedInputs, tx);

            // HINT: This will work if bulkCreate will preserve the order of the inputs.
            const batchEntries = transactions.flatMap((transaction, index) =>
                batch[index].entries.map(entry => ({
                    ...entry,
                    transactionId: transaction.id,
                    amount: convertToMicroUnits(entry.amount)
                }))
            );

            const batchTags = transactions.flatMap((transaction, index) =>
                batch[index].tagIds.map(tagId => ({ transactionId: transaction.id, tagId }))
            );

            await this.transactionEntryRepository.bulkCreate(batchEntries, tx);
            await this.transactionTagsRepository.bulkCreate(batchTags, tx);

            return transactions;
        });
    }

    private async upsertEntriesAndTags(transactionId: number, input: TransactionCreateInputInterface, tx: Transaction): Promise<void> {
        await this.transactionEntryRepository.deleteByTransactionId(transactionId, tx);

        await this.transactionEntryRepository.bulkCreate(
            input.entries.map(entry => ({ ...entry, amount: convertToMicroUnits(entry.amount), transactionId }), tx)
        );

        await this.transactionTagsRepository.deleteByTransactionId(transactionId, tx);

        if (isNotEmptyArray(input.tagIds)) {
            await this.transactionTagsRepository.bulkCreate(
                input.tagIds.map(tagId => ({ transactionId, tagId })),
                tx
            );
        }
    }
}
