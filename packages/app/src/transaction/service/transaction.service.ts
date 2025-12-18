/* eslint-disable lingui/no-unlocalized-strings */
import {
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryTypeEnum
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    db,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

class TransactionService {
    async createInternal(input: TransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.create(
                {
                    tagIds: [],
                    entries: [],
                    externalId: null,
                    type: input.type,
                    title: input.title,
                    externalSource: null,
                    comment: input.comment,
                    operatedAt: input.operatedAt,
                    toAccountId: input.toAccountId,
                    exchangeRate: input.exchangeRate,
                    fromAccountId: input.fromAccountId,
                    amount: convertToMicroUnits(input.amount)
                },
                tx
            );

            await Promise.all(
                input.entries.map(async entry =>
                    transactionEntryRepository.create(
                        { ...entry, amount: convertToMicroUnits(entry.amount), transactionId: transaction.id },
                        tx
                    )
                )
            );

            if (isNotEmptyArray(input.tagIds)) {
                await Promise.all(
                    input.tagIds.map(async id => transactionTagsRepository.create({ transactionId: transaction.id, tagId: id }, tx))
                );
            }

            return transaction;
        });
    }

    async createInternalTransfer(input: TransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const fromEntry = input.entries.find(({ accountId }) => accountId === input.fromAccountId);
            const toEntry = input.entries.find(({ accountId }) => accountId === input.toAccountId);

            if (!isDefined(fromEntry) || !isDefined(toEntry)) {
                throw new Error('Transfer must have exactly two entries');
            }

            const fromAmount = convertToMicroUnits(fromEntry.amount);
            const toAmount = convertToMicroUnits(toEntry.amount);

            const transaction = await transactionRepository.create(
                {
                    tagIds: [],
                    entries: [],
                    externalId: null,
                    type: input.type,
                    amount: fromAmount,
                    title: input.title,
                    externalSource: null,
                    comment: input.comment,
                    operatedAt: input.operatedAt,
                    toAccountId: input.toAccountId,
                    exchangeRate: fromEntry.instrumentId === toEntry.instrumentId ? 1 : toAmount / fromAmount,
                    fromAccountId: input.fromAccountId,
                },
                tx
            );

            await transactionEntryRepository.create(
                {
                    ...fromEntry,
                    amount: fromAmount,
                    accountId: toEntry.accountId,
                    transactionId: transaction.id,
                    type: TransactionEntryTypeEnum.CREDIT,
                    instrumentId: fromEntry.instrumentId
                },
                tx
            );

            await transactionEntryRepository.create(
                {
                    ...toEntry,
                    amount: toAmount,
                    accountId: toEntry.accountId,
                    transactionId: transaction.id,
                    instrumentId: toEntry.instrumentId,
                    type: TransactionEntryTypeEnum.DEBIT
                },
                tx
            );

            if (isNotEmptyArray(input.tagIds)) {
                await Promise.all(
                    input.tagIds.map(async id => transactionTagsRepository.create({ transactionId: transaction.id, tagId: id }, tx))
                );
            }

            return transaction;
        });
    }

    async updateById(id: number, input: TransactionCreateEntityInterface): Promise<TransactionEntityInterface> {
        return await db.transaction(async tx => {
            const transaction = await transactionRepository.updateById(
                id,
                {
                    type: input.type,
                    title: input.title,
                    comment: input.comment,
                    operatedAt: input.operatedAt,
                    toAccountId: input.toAccountId,
                    exchangeRate: input.exchangeRate,
                    fromAccountId: input.fromAccountId,
                    amount: convertToMicroUnits(input.amount)
                },
                tx
            );

            await transactionEntryRepository.deleteByTransactionId(id, tx);
            await Promise.all(
                input.entries.map(async entry =>
                    transactionEntryRepository.create({ ...entry, amount: convertToMicroUnits(entry.amount), transactionId: id }, tx)
                )
            );

            await transactionTagsRepository.deleteByTransactionId(id, tx);
            if (isNotEmptyArray(input.tagIds)) {
                await Promise.all(input.tagIds.map(async tagId => transactionTagsRepository.create({ transactionId: id, tagId }, tx)));
            }

            return transaction;
        });
    }
}

export const transactionService = new TransactionService();
