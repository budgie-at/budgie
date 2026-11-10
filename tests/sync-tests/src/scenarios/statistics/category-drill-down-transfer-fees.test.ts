import {
    CategoryEntityTable,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    StatisticsRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const OCTOBER = { from: new Date('2026-10-01T00:00:00.000Z'), to: new Date('2026-10-31T23:59:59.999Z') };
const OPERATED_AT = new Date('2026-10-11T12:00:00.000Z');

const insertCategory = (title: string) =>
    insertOne(CategoryEntityTable, { title, titleSearch: title.toLowerCase(), icon: UserIconNameEnum.House, parentId: null });

const insertTransaction = (type: TransactionTypeEnum, fromAccountId: number, toAccountId: number | null) =>
    insertOne(TransactionEntityTable, {
        type,
        title: `Fee drill-down ${type}`,
        operatedAt: OPERATED_AT,
        comment: '',
        fromAccountId,
        toAccountId,
        exchangeRate: 1,
        externalId: null,
        externalSource: null,
        updatedBy: null
    });

const insertEntry = (transactionId: number, accountId: number, type: TransactionEntryTypeEnum, amount: number, categoryId: number | null) =>
    insertOne(TransactionEntryEntityTable, {
        transactionId,
        accountId,
        type,
        amount,
        categoryId,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: amount,
        toIban: null,
        originalTransactionId: null
    });

describe('expense category drill-down with transfer fees', () => {
    it.effect('lists the transfer and the split expense with per-row category amounts that add up to the category total', () =>
        Effect.gen(function* () {
            const statisticsRepository = yield* StatisticsRepository;
            const card = yield* seed.account({ title: 'Card', externalId: 'fee-drill-card' });
            const savings = yield* seed.account({ title: 'Savings', externalId: 'fee-drill-savings' });
            const category = yield* insertCategory('Bank fees drill-down');
            const otherCategory = yield* insertCategory('Other drill-down');
            const expense = yield* insertTransaction(TransactionTypeEnum.EXPENSE, card.id, null);
            const split = yield* insertTransaction(TransactionTypeEnum.EXPENSE, card.id, null);
            const transfer = yield* insertTransaction(TransactionTypeEnum.TRANSFER, card.id, savings.id);

            yield* insertEntry(expense.id, card.id, TransactionEntryTypeEnum.CREDIT, 30 * PRECISION, category.id);
            yield* insertEntry(split.id, card.id, TransactionEntryTypeEnum.CREDIT, 20 * PRECISION, category.id);
            yield* insertEntry(split.id, card.id, TransactionEntryTypeEnum.CREDIT, 10 * PRECISION, otherCategory.id);
            yield* insertEntry(transfer.id, card.id, TransactionEntryTypeEnum.CREDIT, 500 * PRECISION, null);
            yield* insertEntry(transfer.id, savings.id, TransactionEntryTypeEnum.DEBIT, 500 * PRECISION, null);
            yield* insertEntry(transfer.id, card.id, TransactionEntryTypeEnum.FEE, 2 * PRECISION, category.id);

            const filters = { ...DEFAULT_TRANSACTION_FILTER, date: OCTOBER };
            const ranking = yield* statisticsRepository.getExpenseByCategoryQuery(filters, card.instrumentId, LanguageEnum.EN);
            const drillDown = yield* statisticsRepository.getTransactions(
                { ...filters, type: TransactionTypeEnum.EXPENSE, categoryIds: [category.id], excludedCategoryIds: null },
                100,
                LanguageEnum.EN
            );
            const rowAmounts = new Map(
                drillDown.map(transaction => [
                    transaction.id,
                    transaction.entries.filter(entry => entry.categoryId === category.id).reduce((sum, entry) => sum + entry.amount, 0)
                ])
            );
            const categoryAmount = ranking.find(row => row.category?.id === category.id)?.amount;

            expect(rowAmounts).toStrictEqual(
                new Map([
                    [expense.id, 30 * PRECISION],
                    [split.id, 20 * PRECISION],
                    [transfer.id, 2 * PRECISION]
                ])
            );
            expect(categoryAmount).toBe(52 * PRECISION);
            expect([...rowAmounts.values()].reduce((sum, amount) => sum + amount, 0)).toBe(categoryAmount);
        }).pipe(Effect.provide(TestLayer))
    );
});
