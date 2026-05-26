import { describe, expect, it } from 'vitest';

import { instrumentRepository, statisticsRepository } from '@app/@generic/drizzle/db/db';
import { entryBaseValuationService } from '@app/money-data/service/entry-base-valuation.service';
import {
    CategoryEntityTable,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    LanguageEnum,
    PRECISION,
    SettingsEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { isDefined } from '@rnw-community/shared';

import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

describe('base valuation', () => {
    it('values imported UAH entries with seeded historical NBU rates', async () => {
        const euro = await requireInstrument(CurrencyEnum.EUR);
        const hryvnia = await requireInstrument(CurrencyEnum.UAH);
        const account = seed.account({ instrumentId: hryvnia.id });

        await setDefaultInstrument(euro.id);

        const valuation = await entryBaseValuationService.valueMicroUnitEntry({
            accountId: account.id,
            amount: 50 * PRECISION,
            operatedAt: new Date('2011-05-25T12:00:00.000Z'),
            externalSource: ExternalSourceEnum.CSV
        });

        expect(valuation).toStrictEqual({
            baseInstrumentId: euro.id,
            baseExchangeRate: 0.0889028367561666,
            baseAmount: 4_445_142
        });
    });

    it('sums analytics with historical base amounts from different periods', async () => {
        const euro = await requireInstrument(CurrencyEnum.EUR);
        const hryvnia = await requireInstrument(CurrencyEnum.UAH);
        const [category] = await dbCategories();
        const account = seed.account({ instrumentId: hryvnia.id });

        await setDefaultInstrument(euro.id);
        await createHistoricalExpense(account.id, category.id, new Date('2011-05-25T12:00:00.000Z'));
        await createHistoricalExpense(account.id, category.id, new Date('2026-05-25T12:00:00.000Z'));

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, euro.id).get();
        const [categoryTotal] = statisticsRepository.getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, euro.id, LanguageEnum.EN).all();

        expect(totals?.expense).toBe(5_419_222);
        expect(totals?.income).toBe(0);
        expect(categoryTotal?.amount).toBe(5_419_222);
    });
});

const setDefaultInstrument = async (defaultInstrumentId: number): Promise<void> => {
    await testDb.update(SettingsEntityTable).set({ defaultInstrumentId });
};

const requireInstrument = async (code: CurrencyEnum) => {
    const instrument = await instrumentRepository.findByCode(code);

    if (!isDefined(instrument)) {
        throw new Error(`Instrument ${code} not found`);
    }

    return instrument;
};

const dbCategories = async () => {
    return await testDb.select().from(CategoryEntityTable);
};

const createHistoricalExpense = async (accountId: number, categoryId: number, operatedAt: Date): Promise<void> => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Historical UAH expense',
        operatedAt,
        comment: '',
        toAccountId: null,
        fromAccountId: accountId,
        exchangeRate: 1,
        externalId: null,
        externalSource: ExternalSourceEnum.CSV,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);
    const valuation = await entryBaseValuationService.valueMicroUnitEntry({
        accountId,
        amount: 50 * PRECISION,
        operatedAt,
        externalSource: ExternalSourceEnum.CSV
    });

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: 50 * PRECISION,
        categoryId,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: valuation.baseInstrumentId,
        baseExchangeRate: valuation.baseExchangeRate,
        baseAmount: valuation.baseAmount,
        toIban: null
    } satisfies TransactionEntryCreateEntityInterface);
};
