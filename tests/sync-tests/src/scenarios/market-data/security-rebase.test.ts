import {
    AccountTypeEnum,
    HistoricalExchangeRateEntityTable,
    InstrumentRepository,
    InstrumentPriceProviderEnum,
    InstrumentTypeEnum,
    SettingsEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryPositionRepository,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { MoneyDataUpgradeService } from '@budgie/ledger';
import { calculateInstrumentPosition } from '@budgie/market';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { requireInstrument, seed, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

it.effect('rebases security trade costs from cash consideration and scopes FIFO and dividends to the brokerage', () =>
    Effect.gen(function* () {
        const euro = yield* requireInstrument('EUR');
        const dollar = yield* requireInstrument('USD');
        const instruments = yield* InstrumentRepository;
        const positions = yield* TransactionEntryPositionRepository;
        const upgrade = yield* MoneyDataUpgradeService;
        const security = yield* instruments.create({
            code: 'YAHOO:REBASE',
            name: 'Rebase stock',
            symbol: 'REBASE',
            type: InstrumentTypeEnum.EQUITY,
            priceProvider: InstrumentPriceProviderEnum.YAHOO,
            providerInstrumentId: 'REBASE',
            quoteInstrumentId: dollar.id
        });
        const cash = yield* seed.account({ instrumentId: dollar.id, type: AccountTypeEnum.BANK });
        const account = yield* seed.account({ instrumentId: security.id, type: AccountTypeEnum.STOCKS });
        const other = yield* seed.account({ instrumentId: security.id, type: AccountTypeEnum.STOCKS });
        yield* testDb.insert(HistoricalExchangeRateEntityTable).values([
            { sourceInstrumentId: dollar.id, targetInstrumentId: euro.id, rateDate: '2026-11-12', rate: 0.5 },
            { sourceInstrumentId: security.id, targetInstrumentId: dollar.id, rateDate: '2026-11-12', rate: 900 }
        ]);
        yield* Effect.forEach([account.id, other.id], accountId =>
            Effect.gen(function* () {
                const transaction = yield* insertOne(TransactionEntityTable, {
                    type: TransactionTypeEnum.TRANSFER,
                    title: 'Buy',
                    operatedAt: new Date('2026-11-12T12:00:00Z'),
                    exchangeRate: 1,
                    fromAccountId: cash.id,
                    toAccountId: accountId
                });
                yield* testDb.insert(TransactionEntryEntityTable).values([
                    {
                        transactionId: transaction.id,
                        accountId: cash.id,
                        type: TransactionEntryTypeEnum.CREDIT,
                        amount: 100_000_000,
                        baseInstrumentId: dollar.id,
                        baseExchangeRate: 1,
                        baseAmount: 100_000_000
                    },
                    {
                        transactionId: transaction.id,
                        accountId,
                        type: TransactionEntryTypeEnum.DEBIT,
                        amount: 2_000_000,
                        baseInstrumentId: dollar.id,
                        baseExchangeRate: 50,
                        baseAmount: 100_000_000
                    }
                ]);
            })
        );
        yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
        yield* upgrade.run('Missing base');
        const entries = yield* positions.findInstrumentPositionEntries(security.id, euro.id, [account.id]);
        expect(calculateInstrumentPosition(entries)).toMatchObject({ amount: 2, costBasis: 50, averageCost: 25 });
        expect(calculateInstrumentPosition(yield* positions.findInstrumentPositionEntries(security.id, euro.id))).toMatchObject({
            amount: 4,
            costBasis: 100
        });
        yield* Effect.forEach(
            [
                { type: TransactionTypeEnum.INCOME, entryType: TransactionEntryTypeEnum.DEBIT, amount: 10_000_000 },
                { type: TransactionTypeEnum.EXPENSE, entryType: TransactionEntryTypeEnum.CREDIT, amount: 2_000_000 }
            ],
            input =>
                Effect.gen(function* () {
                    const transaction = yield* insertOne(TransactionEntityTable, {
                        type: input.type,
                        title: 'Dividend and tax',
                        operatedAt: new Date('2026-11-12T12:00:00Z'),
                        exchangeRate: 1,
                        fromAccountId: cash.id,
                        toAccountId: cash.id
                    });
                    yield* testDb.insert(TransactionEntryEntityTable).values({
                        transactionId: transaction.id,
                        accountId: cash.id,
                        type: input.entryType,
                        amount: input.amount,
                        baseInstrumentId: euro.id,
                        baseAmount: input.amount,
                        baseExchangeRate: 1
                    });
                })
        );
        yield* upgrade.run('Missing base');
        expect(yield* positions.findCashReturn([cash.id], euro.id)).toBe(8);
        expect(yield* positions.findCashReturn([other.id], euro.id)).toBe(0);
    }).pipe(Effect.provide(TestLayer))
);
