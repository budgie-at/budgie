import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { entryBaseValuationService } from '@app/money-data/service/entry-base-valuation.service';
import { transactionService } from '@app/transaction/service/transaction.service';
import {
    AccountTypeEnum,
    CurrencyEnum,
    ExternalSourceEnum,
    SettingsEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { BetterSQLiteSession } from 'drizzle-orm/better-sqlite3/session';
import * as Effect from 'effect/Effect';
import { describe, expect, it, vi } from 'vitest';

import { requireInstrument, seed, testDb, run } from '../../harness';

const TRANSACTION_COUNT = 200;
const DISTINCT_DAY_COUNT = 20;
const DAY_MS = 86_400_000;

const buildExpenseInput = (accountId: number, index: number) => ({
    type: TransactionTypeEnum.EXPENSE,
    title: `Merchant ${index % 17}`,
    amount: 1000 + index,
    operatedAt: new Date(Date.UTC(2026, 0, 1, 12) + (index % DISTINCT_DAY_COUNT) * DAY_MS),
    comment: '',
    fromAccountId: accountId,
    toAccountId: null,
    exchangeRate: 1,
    externalId: `batch-valuation-${index}`,
    externalSource: ExternalSourceEnum.MONOBANK,
    updatedBy: null,
    tagIds: [],
    entries: [
        {
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount: 1000 + index,
            categoryId: null,
            mccCategoryId: null,
            externalId: `batch-valuation-${index}`
        }
    ]
});

describe('batch entry valuation', () => {
    it('values a 200-row import with a constant number of lookups and per-entry identical results', async () => {
        const euro = await requireInstrument(CurrencyEnum.EUR);
        const hryvnia = await requireInstrument(CurrencyEnum.UAH);
        const account = seed.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: hryvnia.id });
        const inputs = Array.from({ length: TRANSACTION_COUNT }, (_, index) => buildExpenseInput(account.id, index));

        await testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });

        const prepareSpy = vi.spyOn(BetterSQLiteSession.prototype, 'prepareQuery');

        await run(transactionService.bulkCreate(inputs));

        expect(prepareSpy.mock.calls.length).toBeLessThan(DISTINCT_DAY_COUNT + 20);
        prepareSpy.mockRestore();

        const entries = await testDb.select().from(TransactionEntryEntityTable);
        const expected = await run(
            Effect.all(
                inputs.map(input =>
                    entryBaseValuationService.valueMicroUnitEntry({
                        accountId: account.id,
                        amount: convertToMicroUnits(input.amount),
                        operatedAt: input.operatedAt,
                        externalSource: input.externalSource
                    })
                )
            )
        );

        expect(
            entries.map(({ externalId, baseInstrumentId, baseExchangeRate, baseAmount }) => ({
                externalId,
                baseInstrumentId,
                baseExchangeRate,
                baseAmount
            }))
        ).toStrictEqual(inputs.map((input, index) => ({ externalId: input.externalId, ...expected[index] })));
    });
});
