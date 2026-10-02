import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { makeTestDatabase } from '@budgie-at/test-kit';
import {
    AccountTypeEnum,
    CurrencyEnum,
    Db,
    ExternalSourceEnum,
    SettingsEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { EntryBaseValuationService } from '@budgie/market';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { requireInstrument, seed, testDb, TestLayer } from '../../harness';

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
    it.effect('values a 200-row import with a constant number of lookups and per-entry identical results', () =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const transactionService = yield* TransactionService;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
            const account = yield* seed.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: hryvnia.id });
            const inputs = Array.from({ length: TRANSACTION_COUNT }, (_, index) => buildExpenseInput(account.id, index));

            yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });

            const executedStatements: string[] = [];
            const countingDatabase = yield* makeTestDatabase(testDb.$client, queryText => executedStatements.push(queryText));

            yield* transactionService.bulkCreate(inputs).pipe(Effect.provideService(Db, countingDatabase));

            expect(executedStatements.length).toBeGreaterThan(0);
            expect(executedStatements.length).toBeLessThan(DISTINCT_DAY_COUNT + 20);

            const entries = yield* testDb.select().from(TransactionEntryEntityTable);
            const expected = yield* Effect.all(
                inputs.map(input =>
                    entryBaseValuationService.valueMicroUnitEntry({
                        accountId: account.id,
                        amount: convertToMicroUnits(input.amount),
                        operatedAt: input.operatedAt
                    })
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
        }).pipe(Effect.provide(TestLayer))
    );
});
