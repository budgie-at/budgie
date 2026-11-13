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
    TransactionEntryBaseValuationRepository,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { MoneyDataUpgradeService } from '@budgie/ledger';
import { HistoricalMarketDataService, InstrumentMarketDataJobRepository, calculateInstrumentPosition } from '@budgie/market';
import { expect, it } from '@effect/vitest';
import { sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

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
                        quotedInstrumentId: dollar.id,
                        quotedUnitPrice: 50_000_000,
                        baseExchangeRate: 50,
                        baseAmount: 100_000_000
                    }
                ]);
            })
        );
        yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
        yield* upgrade.run('Missing base');
        const entries = yield* positions.findInstrumentPositionEntries(security.id, euro.id);
        expect(calculateInstrumentPosition(entries, [account.id])).toMatchObject({ amount: 2, costBasis: 50, averageCost: 25 });
        expect(calculateInstrumentPosition(yield* positions.findInstrumentPositionEntries(security.id, euro.id))).toMatchObject({
            amount: 4,
            costBasis: 100
        });
        const market = yield* HistoricalMarketDataService;
        const jobs = yield* InstrumentMarketDataJobRepository;
        yield* jobs.enqueueMany([{ instrumentId: euro.id, quoteInstrumentId: euro.id, fromDate: '2026-11-12', toDate: '2026-11-12' }]);
        const job = yield* Effect.flatMap(market.claimNextJob, Effect.fromNullishOr);
        yield* market.storeJobData(job, {
            prices: [],
            rates: [{ sourceInstrumentId: dollar.id, targetInstrumentId: euro.id, rateDate: '2026-11-12', rate: 0.8 }],
            unsupportedInstruments: []
        });
        expect(
            calculateInstrumentPosition(yield* positions.findInstrumentPositionEntries(security.id, euro.id), [account.id])
        ).toMatchObject({
            amount: 2,
            costBasis: 80,
            realizedProfitLoss: 0
        });
        yield* jobs.enqueueMany([
            { instrumentId: security.id, quoteInstrumentId: dollar.id, fromDate: '2026-11-12', toDate: '2026-11-12' }
        ]);
        const securityJob = yield* Effect.flatMap(market.claimNextJob, Effect.fromNullishOr);
        yield* market.storeJobData(securityJob, {
            prices: [],
            rates: [{ sourceInstrumentId: security.id, targetInstrumentId: dollar.id, rateDate: '2026-11-12', rate: 1200 }],
            unsupportedInstruments: []
        });
        expect(
            calculateInstrumentPosition(yield* positions.findInstrumentPositionEntries(security.id, euro.id), [account.id])
        ).toMatchObject({
            amount: 2,
            costBasis: 80
        });
        const transfer = yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.TRANSFER,
            title: 'Move stock',
            operatedAt: new Date('2026-11-12T13:00:00Z'),
            exchangeRate: 1,
            fromAccountId: account.id,
            toAccountId: other.id
        });
        yield* testDb.insert(TransactionEntryEntityTable).values([
            {
                transactionId: transfer.id,
                accountId: account.id,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: 1_000_000,
                baseInstrumentId: euro.id,
                baseAmount: 60_000_000,
                baseExchangeRate: 60
            },
            {
                transactionId: transfer.id,
                accountId: other.id,
                type: TransactionEntryTypeEnum.DEBIT,
                amount: 1_000_000,
                baseInstrumentId: euro.id,
                baseAmount: 60_000_000,
                baseExchangeRate: 60
            }
        ]);
        expect(
            calculateInstrumentPosition(yield* positions.findInstrumentPositionEntries(security.id, euro.id), [account.id])
        ).toMatchObject({ amount: 1, costBasis: 40, realizedProfitLoss: 0 });
        expect(calculateInstrumentPosition(yield* positions.findInstrumentPositionEntries(security.id, euro.id), [other.id])).toMatchObject(
            { amount: 3, costBasis: 120, realizedProfitLoss: 0 }
        );
        expect(calculateInstrumentPosition(yield* positions.findInstrumentPositionEntries(security.id, euro.id))).toMatchObject({
            amount: 4,
            costBasis: 160,
            realizedProfitLoss: 0
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
        const valuation = yield* TransactionEntryBaseValuationRepository;
        yield* valuation.rebaseSecurityTradeCosts(euro.id);
        expect(yield* testDb.get<{ changes: number }>(sql`SELECT changes() AS changes`)).toEqual({ changes: 0 });
        expect(yield* positions.findCashReturn([cash.id], euro.id)).toBe(8);
        expect(yield* positions.findCashReturn([other.id], euro.id)).toBe(0);
    }).pipe(
        Effect.provide([
            TestLayer,
            HistoricalMarketDataService.layer.pipe(Layer.provide(TestLayer)),
            TransactionEntryBaseValuationRepository.layer,
            InstrumentMarketDataJobRepository.layer
        ])
    )
);
