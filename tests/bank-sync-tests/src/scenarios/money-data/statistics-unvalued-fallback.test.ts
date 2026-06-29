import { describe, expect, it } from 'vitest';

import { statisticsRepository, transactionEntryRepository } from '@app/@generic/drizzle/db/db';
import { moneyDataUpgradeService } from '@app/money-data/service/money-data-upgrade.service';
import {
    AccountTypeEnum,
    CategoryEntityTable,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExchangeRateEntityTable,
    LanguageEnum,
    PRECISION,
    SettingsEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { requireInstrument } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const UNCONVERTIBLE_EXPENSE_AMOUNT = Number('15000') * PRECISION;

const seedUnconvertibleExpense = async (title: string) => {
    const euro = await requireInstrument(CurrencyEnum.EUR);
    const foreignInstrument = seed.instrument({
        code: 'NOFX',
        name: 'No Rate Currency',
        symbol: 'NF'
    });
    const account = seed.account({ instrumentId: foreignInstrument.id, type: AccountTypeEnum.BANK });
    const [category] = await testDb.select().from(CategoryEntityTable);

    await testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });

    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title,
        operatedAt: new Date('2026-05-15T12:00:00.000Z'),
        comment: '',
        fromAccountId: account.id,
        toAccountId: null,
        exchangeRate: 1,
        externalId: null,
        externalSource: null,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    const entry = insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: account.id,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: UNCONVERTIBLE_EXPENSE_AMOUNT,
        categoryId: category.id,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: null,
        toIban: null
    } satisfies TransactionEntryCreateEntityInterface);

    return { category, entry, euro, transaction };
};

const getExpenseCategoryAmount = (categoryId: number, baseInstrumentId: number) => {
    const categoryRows = statisticsRepository
        .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, baseInstrumentId, LanguageEnum.EN)
        .all();

    return categoryRows.find(row => row.category?.id === categoryId)?.amount ?? 0;
};

describe('statistics fallback for unvalued entries', () => {
    it('includes an unvalued foreign income entry via live conversion instead of dropping it', async () => {
        const euro = await requireInstrument(CurrencyEnum.EUR);
        const hryvnia = await requireInstrument(CurrencyEnum.UAH);
        const account = seed.account({ instrumentId: hryvnia.id, type: AccountTypeEnum.BANK });

        await testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
        insertOne(ExchangeRateEntityTable, { source: 'test', baseInstrumentId: hryvnia.id, quoteInstrumentId: euro.id, rate: 0.02 });

        const transaction = insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.INCOME,
            title: 'Unvalued UAH income',
            operatedAt: new Date('2026-05-15T12:00:00.000Z'),
            comment: '',
            fromAccountId: null,
            toAccountId: account.id,
            exchangeRate: 1,
            externalId: null,
            externalSource: null,
            updatedBy: null
        } satisfies TransactionCreateEntityInterface);

        insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId: account.id,
            type: TransactionEntryTypeEnum.DEBIT,
            amount: 1000 * PRECISION,
            categoryId: null,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: null,
            baseExchangeRate: null,
            baseAmount: null,
            toIban: null
        } satisfies TransactionEntryCreateEntityInterface);

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, euro.id).get();

        expect(totals?.income).toBe(20 * PRECISION);
        expect(totals?.expense).toBe(0);
    });

    it('does not treat unconvertible foreign expenses as default-currency amounts', async () => {
        const { category, euro, transaction } = await seedUnconvertibleExpense('Unconvertible foreign expense');
        const tag = seed.tag('Car');

        seed.transactionTag(transaction.id, tag.id);

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, euro.id).get();
        const tagRows = statisticsRepository.getExpenseByTagQuery(DEFAULT_TRANSACTION_FILTER, euro.id).all();
        const categoryAmount = getExpenseCategoryAmount(category.id, euro.id);
        const tagAmount = tagRows.find(row => row.tag?.id === tag.id)?.amount ?? 0;

        expect([totals?.expense, categoryAmount, tagAmount]).toStrictEqual([0, 0, 0]);
    });

    it('completes historical valuation while preserving unconvertible entries as unvalued', async () => {
        const { category, entry, euro } = await seedUnconvertibleExpense('Unconvertible upgrade expense');

        await expect(transactionEntryRepository.countPendingBaseValuationEntries(euro.id)).resolves.toBe(1);

        await moneyDataUpgradeService.run();

        const [updatedEntry] = await testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.id, entry.id));
        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, euro.id).get();
        const categoryAmount = getExpenseCategoryAmount(category.id, euro.id);

        expect(updatedEntry?.baseInstrumentId).toBe(euro.id);
        expect(updatedEntry?.baseExchangeRate).toBeNull();
        expect(updatedEntry?.baseAmount).toBeNull();
        await expect(transactionEntryRepository.countPendingBaseValuationEntries(euro.id)).resolves.toBe(0);
        expect(totals?.expense).toBe(0);
        expect(categoryAmount).toBe(0);
    });
});
