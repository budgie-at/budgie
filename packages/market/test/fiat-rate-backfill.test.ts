import {
    AccountRepository,
    CurrencyEnum,
    HistoricalExchangeRateEntityTable,
    InstrumentMarketDataJobEntityTable,
    InstrumentMarketDataJobStatusEnum,
    InstrumentRepository,
    PRECISION,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, gt, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as TestClock from 'effect/testing/TestClock';

import { isDefined } from '@rnw-community/shared';

import { HistoricalMarketDataService } from '../src/market-data/service/historical-market-data.service';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

import { makeRoutedFakeHttpClientLayer, setDefaultInstrument, TestLayer, testDb, testSeedService } from './test-context';

const seedEndDate = '2026-05-25';
const backfilledDates = [
    '2026-05-26',
    '2026-05-27',
    '2026-05-28',
    '2026-05-29',
    '2026-05-30',
    '2026-05-31',
    '2026-06-01',
    '2026-06-02',
    '2026-06-03'
];
const euroRateByCode: Record<string, number> = { UAH: 48, USD: 1.2, GBP: 0.85 };
const requestedQuotes: string[] = [];

const FiatBackfillLayer = Layer.mergeAll(
    TestLayer,
    HistoricalMarketDataService.layer,
    AccountRepository.layer,
    makeRoutedFakeHttpClientLayer(url => {
        if (url.pathname.endsWith('/currencies')) {
            return [{ iso_code: CurrencyEnum.EUR }, { iso_code: CurrencyEnum.USD }, { iso_code: CurrencyEnum.UAH }];
        }

        const quotes = (url.searchParams.get('quotes') ?? '').split(',');

        requestedQuotes.push(...quotes);

        return backfilledDates.flatMap(date => quotes.map(quote => ({ date, base: CurrencyEnum.EUR, quote, rate: euroRateByCode[quote] })));
    })
);

const prepare = Effect.fnUntraced(function* (codes: CurrencyEnum[]) {
    const instrumentRepository = yield* InstrumentRepository;
    const instruments = yield* Effect.forEach(codes, code => Effect.flatMap(instrumentRepository.findByCode(code), Effect.fromNullishOr));

    requestedQuotes.length = 0;
    yield* TestClock.setTime(Date.parse('2026-06-03T12:00:00.000Z'));
    yield* testDb.delete(HistoricalExchangeRateEntityTable).where(gt(HistoricalExchangeRateEntityTable.rateDate, seedEndDate));

    return instruments;
});

const prepareHryvniaAccount = Effect.fnUntraced(function* () {
    const [dollar, hryvnia] = yield* prepare([CurrencyEnum.USD, CurrencyEnum.UAH]);
    const account = yield* testSeedService.account({ instrumentId: hryvnia.id });

    yield* setDefaultInstrument(dollar.id);

    return { dollar, hryvnia, account };
});

const seedHistoryValuedExpense = Effect.fnUntraced(function* (accountId: number, baseInstrumentId: number, baseExchangeRate: number) {
    const transaction = yield* testSeedService.manualExpense({
        accountId,
        amount: 1000 * PRECISION,
        operatedAt: new Date('2026-06-01T12:00:00.000Z')
    });

    yield* testDb
        .update(TransactionEntryEntityTable)
        .set({ baseInstrumentId, baseExchangeRate, baseAmount: Math.round(1000 * PRECISION * baseExchangeRate) })
        .where(eq(TransactionEntryEntityTable.transactionId, transaction.id));

    return transaction.id;
});

const findEntryValuation = Effect.fnUntraced(function* (transactionId: number) {
    const [entry] = yield* testDb
        .select({ baseExchangeRate: TransactionEntryEntityTable.baseExchangeRate, baseAmount: TransactionEntryEntityTable.baseAmount })
        .from(TransactionEntryEntityTable)
        .where(eq(TransactionEntryEntityTable.transactionId, transactionId));

    return entry;
});

const drainFiatJob = Effect.fnUntraced(function* () {
    const historicalMarketDataService = yield* HistoricalMarketDataService;
    const accountRepository = yield* AccountRepository;

    yield* historicalMarketDataService.enqueueAccounts(yield* accountRepository.getAllActiveAccounts());

    const job = yield* historicalMarketDataService.claimNextJob();

    if (!isDefined(job)) {
        return null;
    }

    const result = yield* historicalMarketDataService.fetchJobData(job);

    yield* historicalMarketDataService.storeJobData(job, result);

    return { job, result };
});

const findBackfilledRates = (instrumentIds: number[]) =>
    testDb
        .select()
        .from(HistoricalExchangeRateEntityTable)
        .where(
            and(
                inArray(HistoricalExchangeRateEntityTable.sourceInstrumentId, instrumentIds),
                gt(HistoricalExchangeRateEntityTable.rateDate, seedEndDate)
            )
        );

describe('fiat rate backfill', () => {
    it.effect('fills the post-seed gap and revalues history-valued entries at their own day rate', () =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const { dollar, hryvnia, account } = yield* prepareHryvniaAccount();
            const staleRate = yield* entryBaseValuationService.resolveHistoricalBaseExchangeRateOrNull(
                hryvnia.id,
                dollar.id,
                new Date('2026-06-01T12:00:00.000Z')
            );
            const historyValuedTransactionId = yield* seedHistoryValuedExpense(account.id, dollar.id, staleRate ?? 0);
            const providedTransactionId = yield* seedHistoryValuedExpense(account.id, dollar.id, 0.03);
            const drained = yield* drainFiatJob();
            const rates = yield* findBackfilledRates([hryvnia.id]);

            expect(drained?.job.fromDate).toBe('2026-05-26');
            expect(rates.find(rate => rate.rateDate === '2026-06-01')?.rate).toBeCloseTo(1 / 48, 12);
            expect(staleRate).not.toBeCloseTo(0.025, 6);
            expect((yield* findEntryValuation(historyValuedTransactionId)).baseExchangeRate).toBeCloseTo(0.025, 12);
            expect((yield* findEntryValuation(historyValuedTransactionId)).baseAmount).toBe(25 * PRECISION);
            expect(yield* findEntryValuation(providedTransactionId)).toStrictEqual({ baseExchangeRate: 0.03, baseAmount: 30 * PRECISION });
        }).pipe(Effect.provide(FiatBackfillLayer))
    );

    it.effect('does nothing more when the backfill runs again', () =>
        Effect.gen(function* () {
            const historicalMarketDataService = yield* HistoricalMarketDataService;
            const { dollar, hryvnia, account } = yield* prepareHryvniaAccount();
            const transactionId = yield* seedHistoryValuedExpense(account.id, dollar.id, 0.02);
            const drained = yield* drainFiatJob();
            const valuation = yield* findEntryValuation(transactionId);
            const rates = yield* findBackfilledRates([dollar.id, hryvnia.id]);

            if (isDefined(drained)) {
                yield* historicalMarketDataService.storeJobData(drained.job, drained.result);
            }

            expect(yield* drainFiatJob()).toBeNull();
            expect(yield* findEntryValuation(transactionId)).toStrictEqual(valuation);
            expect(yield* findBackfilledRates([dollar.id, hryvnia.id])).toHaveLength(rates.length);
            expect(rates).toHaveLength(2 * backfilledDates.length);
        }).pipe(Effect.provide(FiatBackfillLayer))
    );

    it.effect('skips currencies the rate source does not cover', () =>
        Effect.gen(function* () {
            const [dollar, pound] = yield* prepare([CurrencyEnum.USD, CurrencyEnum.GBP]);

            yield* setDefaultInstrument(dollar.id);
            yield* testSeedService.account({ instrumentId: pound.id });

            const drained = yield* drainFiatJob();

            expect(drained?.result.unsupportedInstruments.map(instrument => instrument.code)).toStrictEqual([CurrencyEnum.GBP]);
            expect(requestedQuotes).not.toContain(CurrencyEnum.GBP);
            expect(yield* findBackfilledRates([pound.id])).toStrictEqual([]);
            expect(yield* findBackfilledRates([dollar.id])).toHaveLength(backfilledDates.length);
        }).pipe(Effect.provide(FiatBackfillLayer))
    );

    it.effect('stops refetching a held currency the rate source does not cover', () =>
        Effect.gen(function* () {
            const [dollar, pound, euro] = yield* prepare([CurrencyEnum.USD, CurrencyEnum.GBP, CurrencyEnum.EUR]);

            yield* setDefaultInstrument(dollar.id);
            yield* testSeedService.account({ instrumentId: pound.id });
            yield* drainFiatJob();
            yield* testDb
                .insert(HistoricalExchangeRateEntityTable)
                .values({ sourceInstrumentId: dollar.id, targetInstrumentId: euro.id, rateDate: '2026-06-04', rate: 1 / 1.2 });
            yield* TestClock.adjust('1 day');

            expect(yield* drainFiatJob()).toBeNull();
            expect(
                yield* testDb
                    .select({
                        instrumentId: InstrumentMarketDataJobEntityTable.instrumentId,
                        quoteInstrumentId: InstrumentMarketDataJobEntityTable.quoteInstrumentId
                    })
                    .from(InstrumentMarketDataJobEntityTable)
                    .where(eq(InstrumentMarketDataJobEntityTable.status, InstrumentMarketDataJobStatusEnum.UNSUPPORTED))
            ).toStrictEqual([{ instrumentId: pound.id, quoteInstrumentId: euro.id }]);
        }).pipe(Effect.provide(FiatBackfillLayer))
    );
});
