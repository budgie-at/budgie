import {
    CategoryEntityTable,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
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

import { requireInstrument, seed, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const OCTOBER = { from: new Date('2026-10-01T00:00:00.000Z'), to: new Date('2026-10-31T23:59:59.999Z') };
const OPERATED_AT = new Date('2026-10-11T12:00:00.000Z');
const CENT = PRECISION / 100;
const CONVERTED_BASE_AMOUNTS = [518_171_161, 528_722_157, 539_273_154, 507_620_164];

const insertCategory = (title: string, parentId: number | null) =>
    insertOne(CategoryEntityTable, { title, titleSearch: title.toLowerCase(), icon: UserIconNameEnum.House, parentId });

const insertExpense = Effect.fnUntraced(function* (
    accountId: number,
    categoryId: number,
    amount: number,
    baseInstrumentId: number,
    baseAmount: number
) {
    const transaction = yield* insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Parity purchase',
        operatedAt: OPERATED_AT,
        comment: '',
        fromAccountId: accountId,
        toAccountId: null,
        exchangeRate: 1,
        externalId: null,
        externalSource: ExternalSourceEnum.CSV,
        updatedBy: null
    });

    yield* insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount,
        categoryId,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId,
        baseExchangeRate: baseAmount / amount,
        baseAmount,
        toIban: null,
        originalTransactionId: null
    });

    return transaction.id;
});

const fetchOctober = Effect.fnUntraced(function* (baseInstrumentId: number, categoryId: number) {
    const statisticsRepository = yield* StatisticsRepository;
    const filters = { ...DEFAULT_TRANSACTION_FILTER, date: OCTOBER };
    const ranking = yield* statisticsRepository.getExpenseByCategoryQuery(filters, baseInstrumentId, LanguageEnum.EN);
    const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(filters, baseInstrumentId);
    const drillDown = yield* statisticsRepository.getTransactions(
        { ...filters, type: TransactionTypeEnum.EXPENSE, categoryIds: [categoryId], excludedCategoryIds: null },
        100,
        LanguageEnum.EN
    );

    return { ranking, totals, drillDown };
});

describe('category ranking and drill-down parity', () => {
    it.effect('books converted entries at cents so a ranking row equals the sum of its drill-down rows', () =>
        Effect.gen(function* () {
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const dollar = yield* requireInstrument(CurrencyEnum.USD);
            const account = yield* seed.account({ instrumentId: euro.id, externalId: 'parity-euro' });
            const category = yield* insertCategory('Converted parity', null);

            for (const baseAmount of CONVERTED_BASE_AMOUNTS) {
                yield* insertExpense(account.id, category.id, 450 * PRECISION, dollar.id, baseAmount);
            }

            const { ranking, totals, drillDown } = yield* fetchOctober(dollar.id, category.id);
            const drillDownCents = drillDown
                .flatMap(transaction => transaction.entries)
                .reduce((sum, entry) => sum + Math.round((entry.baseAmount ?? 0) / CENT) * CENT, 0);

            expect(ranking.find(row => row.category?.id === category.id)?.amount).toBe(drillDownCents);
            expect(drillDownCents).toBe(2_093_780_000);
            expect(totals.expense).toBe(ranking.reduce((sum, row) => sum + row.amount, 0));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps parent and child categories as separate rows that add up to the total without double counting', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({ externalId: 'parity-parent' });
            const parent = yield* insertCategory('Parent parity', null);
            const child = yield* insertCategory('Child parity', parent.id);
            const parentTransactionId = yield* insertExpense(account.id, parent.id, 30 * PRECISION, account.instrumentId, 30 * PRECISION);

            yield* insertExpense(account.id, child.id, 12 * PRECISION, account.instrumentId, 12 * PRECISION);

            const { ranking, totals, drillDown } = yield* fetchOctober(account.instrumentId, parent.id);
            const amountOf = (categoryId: number) => ranking.find(row => row.category?.id === categoryId)?.amount;

            expect([amountOf(parent.id), amountOf(child.id)]).toStrictEqual([30 * PRECISION, 12 * PRECISION]);
            expect(totals.expense).toBe(42 * PRECISION);
            expect(drillDown.map(transaction => transaction.id)).toStrictEqual([parentTransactionId]);
        }).pipe(Effect.provide(TestLayer))
    );
});
