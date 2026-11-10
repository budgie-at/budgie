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
    it.effect('lists the transfer whose fee is in the category and adds up to the category total', () =>
        Effect.gen(function* () {
            const statisticsRepository = yield* StatisticsRepository;
            const card = yield* seed.account({ title: 'Card', externalId: 'fee-drill-card' });
            const savings = yield* seed.account({ title: 'Savings', externalId: 'fee-drill-savings' });
            const category = yield* insertOne(CategoryEntityTable, {
                title: 'Bank fees drill-down',
                titleSearch: 'bank fees drill-down',
                icon: UserIconNameEnum.House,
                parentId: null
            });
            const expense = yield* insertTransaction(TransactionTypeEnum.EXPENSE, card.id, null);
            const transfer = yield* insertTransaction(TransactionTypeEnum.TRANSFER, card.id, savings.id);

            yield* insertEntry(expense.id, card.id, TransactionEntryTypeEnum.CREDIT, 30 * PRECISION, category.id);
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
            const categoryAmount = ranking.find(row => row.category?.id === category.id)?.amount;
            const listedCategoryAmount = drillDown
                .flatMap(transaction => transaction.entries.map(entry => ({ entry, transactionType: transaction.type })))
                .filter(({ entry }) => entry.categoryId === category.id)
                .filter(
                    ({ entry, transactionType }) =>
                        entry.type === TransactionEntryTypeEnum.FEE ||
                        (transactionType === TransactionTypeEnum.EXPENSE && entry.type === TransactionEntryTypeEnum.CREDIT)
                )
                .reduce((sum, { entry }) => sum + entry.amount, 0);

            expect(categoryAmount).toBe(32 * PRECISION);
            expect(new Set(drillDown.map(transaction => transaction.id))).toStrictEqual(new Set([expense.id, transfer.id]));
            expect(listedCategoryAmount).toBe(categoryAmount);
        }).pipe(Effect.provide(TestLayer))
    );
});
