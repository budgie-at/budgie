import { describe, expect, it } from 'vitest';

import {
    AccountTypeEnum,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExchangeRateEntityTable,
    PRECISION,
    SettingsEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';

import { statisticsRepository } from '@app/@generic/drizzle/db/db';

import { requireInstrument } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

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
});
