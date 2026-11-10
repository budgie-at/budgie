import {
    AccountTypeEnum,
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

import { isDefined } from '@rnw-community/shared';

import { seed, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const OCTOBER = { from: new Date('2026-10-01T00:00:00.000Z'), to: new Date('2026-10-31T23:59:59.999Z') };
const OPERATED_AT = new Date('2026-10-11T12:00:00.000Z');

const insertCategory = (title: string) =>
    insertOne(CategoryEntityTable, { title, titleSearch: title.toLowerCase(), icon: UserIconNameEnum.House, parentId: null });

type TransactionOverrides = Partial<Pick<typeof TransactionEntityTable.$inferInsert, 'deletedAt' | 'consolidationParentTransactionId'>>;

const insertTransaction = (
    type: TransactionTypeEnum,
    fromAccountId: number,
    toAccountId: number | null,
    overrides: TransactionOverrides = {}
) =>
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
        updatedBy: null,
        ...overrides
    });

const insertEntry = (
    transactionId: number,
    accountId: number,
    type: TransactionEntryTypeEnum,
    amount: number,
    categoryId: number | null,
    deletedAt: Date | null = null
) =>
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
        originalTransactionId: null,
        deletedAt
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

interface ShapesFixtureInterface {
    readonly inCategoryId: number | null;
    readonly otherCategoryId: number;
    readonly outsideFeeCategoryId: number | null;
    readonly tagId: number | null;
}

interface SeededShapeInterface {
    readonly name: string;
    readonly id: number;
    readonly isInScope: boolean;
}

const seedShapes = Effect.fnUntraced(function* ({ inCategoryId, otherCategoryId, outsideFeeCategoryId, tagId }: ShapesFixtureInterface) {
    const card = yield* seed.account({ title: 'Card', externalId: 'scope-drill-card' });
    const savings = yield* seed.account({ title: 'Savings', externalId: 'scope-drill-savings' });
    const debt = yield* seed.account({ title: 'Friend', type: AccountTypeEnum.DEBT, externalId: 'scope-drill-debt' });
    const parent = yield* insertTransaction(TransactionTypeEnum.EXPENSE, card.id, null);
    const shapes: SeededShapeInterface[] = [];
    const shape = Effect.fnUntraced(function* (name: string, isInScope: boolean, transaction: { readonly id: number }, isTagged = true) {
        if (isDefined(tagId) && isTagged) {
            yield* seed.transactionTag(transaction.id, tagId);
        }

        shapes.push({ name, id: transaction.id, isInScope });
    });
    const transferLegs = Effect.fnUntraced(function* (transactionId: number) {
        yield* insertEntry(transactionId, card.id, TransactionEntryTypeEnum.CREDIT, 500 * PRECISION, null);
        yield* insertEntry(transactionId, savings.id, TransactionEntryTypeEnum.DEBIT, 500 * PRECISION, null);
    });

    const plain = yield* insertTransaction(TransactionTypeEnum.EXPENSE, card.id, null);
    yield* insertEntry(plain.id, card.id, TransactionEntryTypeEnum.CREDIT, 30 * PRECISION, inCategoryId);
    yield* shape('plain expense', true, plain);

    const split = yield* insertTransaction(TransactionTypeEnum.EXPENSE, card.id, null);
    yield* insertEntry(split.id, card.id, TransactionEntryTypeEnum.CREDIT, 20 * PRECISION, inCategoryId);
    yield* insertEntry(split.id, card.id, TransactionEntryTypeEnum.CREDIT, 10 * PRECISION, otherCategoryId);
    yield* shape('split expense', true, split);

    const transferFeeIn = yield* insertTransaction(TransactionTypeEnum.TRANSFER, card.id, savings.id);
    yield* transferLegs(transferFeeIn.id);
    yield* insertEntry(transferFeeIn.id, card.id, TransactionEntryTypeEnum.FEE, 2 * PRECISION, inCategoryId);
    yield* shape('transfer with fee in scope', true, transferFeeIn);

    const transferFeeOut = yield* insertTransaction(TransactionTypeEnum.TRANSFER, card.id, savings.id);
    yield* transferLegs(transferFeeOut.id);
    yield* insertEntry(transferFeeOut.id, card.id, TransactionEntryTypeEnum.FEE, 3 * PRECISION, outsideFeeCategoryId);
    yield* shape('transfer with fee outside scope', false, transferFeeOut, false);

    const incomeFee = yield* insertTransaction(TransactionTypeEnum.INCOME, card.id, null);
    yield* insertEntry(incomeFee.id, card.id, TransactionEntryTypeEnum.DEBIT, 100 * PRECISION, null);
    yield* insertEntry(incomeFee.id, card.id, TransactionEntryTypeEnum.FEE, PRECISION, inCategoryId);
    yield* shape('income with fee in scope', true, incomeFee);

    const adjustment = yield* insertTransaction(TransactionTypeEnum.ADJUSTMENT, card.id, null);
    yield* insertEntry(adjustment.id, card.id, TransactionEntryTypeEnum.CREDIT, 5 * PRECISION, inCategoryId);
    yield* insertEntry(adjustment.id, card.id, TransactionEntryTypeEnum.FEE, 4 * PRECISION, inCategoryId);
    yield* shape('adjustment', false, adjustment);

    const child = yield* insertTransaction(TransactionTypeEnum.EXPENSE, card.id, null, { consolidationParentTransactionId: parent.id });
    yield* insertEntry(child.id, card.id, TransactionEntryTypeEnum.CREDIT, 6 * PRECISION, inCategoryId);
    yield* shape('consolidated child', false, child);

    const softDeletedTransaction = yield* insertTransaction(TransactionTypeEnum.EXPENSE, card.id, null, { deletedAt: new Date() });
    yield* insertEntry(softDeletedTransaction.id, card.id, TransactionEntryTypeEnum.CREDIT, 7 * PRECISION, inCategoryId);
    yield* shape('soft-deleted transaction', false, softDeletedTransaction);

    const softDeletedEntry = yield* insertTransaction(TransactionTypeEnum.TRANSFER, card.id, savings.id);
    yield* transferLegs(softDeletedEntry.id);
    yield* insertEntry(softDeletedEntry.id, card.id, TransactionEntryTypeEnum.FEE, 8 * PRECISION, inCategoryId, new Date());
    yield* shape('soft-deleted fee entry', false, softDeletedEntry);

    const debtExpense = yield* insertTransaction(TransactionTypeEnum.EXPENSE, debt.id, null);
    yield* insertEntry(debtExpense.id, debt.id, TransactionEntryTypeEnum.CREDIT, 9 * PRECISION, inCategoryId);
    yield* shape('entry on a debt account', false, debtExpense);

    return { card, shapes };
});

const countedAmount = (
    transaction: { readonly type: TransactionTypeEnum; readonly entries: readonly ScopeEntryInterface[] },
    isScoped: (entry: ScopeEntryInterface) => boolean
) =>
    transaction.type === TransactionTypeEnum.ADJUSTMENT
        ? 0
        : transaction.entries
              .filter(
                  entry =>
                      entry.account.type !== AccountTypeEnum.DEBT &&
                      (entry.type === TransactionEntryTypeEnum.FEE ||
                          (transaction.type === TransactionTypeEnum.EXPENSE && entry.type === TransactionEntryTypeEnum.CREDIT)) &&
                      isScoped(entry)
              )
              .reduce((sum, entry) => sum + entry.amount, 0);

interface ScopeEntryInterface {
    readonly type: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly categoryId: number | null;
    readonly account: { readonly type: AccountTypeEnum };
}

interface TotalRowInterface {
    readonly amount: number;
    readonly transactionCount: number;
}

interface CategoryTotalRowInterface extends TotalRowInterface {
    readonly category: { readonly id: number } | null;
}

interface TagTotalRowInterface extends TotalRowInterface {
    readonly tag: { readonly id: number } | null;
}

interface ScopeInterface {
    readonly categoryIds: number[] | null;
    readonly tagIds: number[] | null;
    readonly isScoped: (entry: ScopeEntryInterface) => boolean;
    readonly pickTotal: (
        categoryRows: readonly CategoryTotalRowInterface[],
        tagRows: readonly TagTotalRowInterface[]
    ) => TotalRowInterface | undefined;
}

const uncategorizedScope: ScopeInterface = {
    categoryIds: [],
    tagIds: null,
    isScoped: entry => entry.categoryId === null,
    pickTotal: categoryRows => categoryRows.find(row => !isDefined(row.category?.id))
};

const compareScope = Effect.fnUntraced(function* (scope: ScopeInterface, instrumentId: number) {
    const statisticsRepository = yield* StatisticsRepository;
    const filters = { ...DEFAULT_TRANSACTION_FILTER, date: OCTOBER };
    const categoryRows = yield* statisticsRepository.getExpenseByCategoryQuery(filters, instrumentId, LanguageEnum.EN);
    const tagRows = yield* statisticsRepository.getExpenseByTagQuery(filters, instrumentId);
    const list = yield* statisticsRepository.getTransactions(
        { ...filters, type: TransactionTypeEnum.EXPENSE, excludedCategoryIds: null, categoryIds: scope.categoryIds, tagIds: scope.tagIds },
        100,
        LanguageEnum.EN
    );

    return {
        total: scope.pickTotal(categoryRows, tagRows),
        listedIds: list.map(transaction => transaction.id).sort((first, second) => first - second),
        listedAmount: list.reduce((sum, transaction) => sum + countedAmount(transaction, scope.isScoped), 0)
    };
});

const expectScopeParity = Effect.fnUntraced(function* (
    scope: ScopeInterface,
    fixture: Pick<ShapesFixtureInterface, 'inCategoryId' | 'outsideFeeCategoryId' | 'tagId'>,
    expected: { readonly names: readonly string[]; readonly amount: number }
) {
    const otherCategory = yield* insertCategory(`Other ${expected.amount}`);
    const { card, shapes } = yield* seedShapes({ ...fixture, otherCategoryId: otherCategory.id });
    const { total, listedIds, listedAmount } = yield* compareScope(scope, card.instrumentId);
    const expectedIds = shapes
        .filter(shape => expected.names.includes(shape.name))
        .map(shape => shape.id)
        .sort((first, second) => first - second);

    expect({ listed: listedIds, count: listedIds.length, amount: listedAmount }).toStrictEqual({
        listed: expectedIds,
        count: total?.transactionCount,
        amount: total?.amount
    });
    expect(total?.amount).toBe(expected.amount * PRECISION);
});

const IN_SCOPE_NAMES = ['plain expense', 'split expense', 'transfer with fee in scope', 'income with fee in scope'];

describe('uncategorised and tag drill-downs with transfer fees', () => {
    it.effect('Uncategorised: lists exactly the transactions its total counts, with per-row amounts adding up to the total', () =>
        Effect.gen(function* () {
            const category = yield* insertCategory('Outside uncategorised');

            yield* expectScopeParity(
                uncategorizedScope,
                { inCategoryId: null, outsideFeeCategoryId: category.id, tagId: null },
                { names: IN_SCOPE_NAMES, amount: 53 }
            );
        }).pipe(Effect.provide(TestLayer))
    );
});
