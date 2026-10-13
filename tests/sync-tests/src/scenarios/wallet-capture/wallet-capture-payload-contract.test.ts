import { WalletCaptureReviewReasonEnum } from '@app/wallet-capture/enum/wallet-capture-review-reason.enum';
import { WalletCaptureImportService } from '@app/wallet-capture/service/wallet-capture-import.service';
import { CurrencyEnum, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { seedExchangeRate } from '../../harness/consolidation/seed-exchange-rate';
import { requireInstrument } from '../../harness/db/require-instrument';
import { testDb } from '../../harness/scenario/setup';
import { TestLayer } from '../../harness/scenario/test-runtime';
import { seed } from '../../harness/seed/seed';
import { walletCaptureSeedHistoricalRate } from '../../harness/wallet-capture/wallet-capture-historical-rate.harness';
import { walletCaptureFindEntry, walletCaptureFindTransaction } from '../../harness/wallet-capture/wallet-capture-import.harness';
import { walletCaptureNativeStub } from '../../harness/wallet-capture/wallet-capture-native.stub';
import { walletCaptureParseSwiftPayload, walletCaptureSwiftJson } from '../../harness/wallet-capture/wallet-capture-swift-payload.harness';

import type { WalletCaptureReviewItemInterface } from '@app/wallet-capture/interface/wallet-capture-review-item.interface';

const CAPTURE_ID = '8E3F58AE-CD1C-45C8-91DA-E54A5C8EA111';
const SECOND_CAPTURE_ID = '8E3F58AE-CD1C-45C8-91DA-E54A5C8EA222';

const drainSwiftCapture = Effect.fnUntraced(function* (accountId: number, overrides: Readonly<Record<string, string | null>> = {}) {
    const walletCaptureImportService = yield* WalletCaptureImportService;

    walletCaptureNativeStub.seed(walletCaptureParseSwiftPayload([walletCaptureSwiftJson(CAPTURE_ID, accountId, overrides)]));

    return yield* walletCaptureImportService.drain();
});

const fetchImported = Effect.fnUntraced(function* () {
    const transaction = yield* walletCaptureFindTransaction(CAPTURE_ID);
    const entry = yield* walletCaptureFindEntry(transaction.id);

    return { transaction, entry };
});

const FIXED_AMOUNT_MICRO = 19990000;
const EURO_RATE = 44.5;
const EURO_AMOUNT_MICRO = 445000000;
const CUSTOM_AMOUNT_MICRO = 25000000;

const AMOUNT_CASES = [
    { literal: '0.30000000000000004', micro: 300000 },
    { literal: '19.99', micro: FIXED_AMOUNT_MICRO },
    { literal: '1234.5', micro: 1234500000 },
    { literal: '0.01', micro: 10000 },
    { literal: '99999999.99', micro: 99999999990000 }
];

const walletCaptureSeedAccount = Effect.fnUntraced(function* () {
    const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);

    return yield* seed.account({ title: 'Wallet card', instrumentId: hryvnia.id });
});

const remainingCaptures = () => Effect.promise(() => walletCaptureNativeStub.getCaptures());

const expectCaptureKeptForReview = Effect.fnUntraced(function* (
    reviewItems: readonly WalletCaptureReviewItemInterface[],
    reason: WalletCaptureReviewReasonEnum
) {
    expect(reviewItems.map(item => item.reason)).toEqual([reason]);
    expect(yield* testDb.select().from(TransactionEntityTable)).toEqual([]);
    expect(yield* remainingCaptures()).toHaveLength(1);
});

describe('wallet-capture/payload-contract amounts and text', () => {
    it.effect.each(AMOUNT_CASES)('Swift Double $literal round-trips to exact microunits $micro', ({ literal, micro }) =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedAccount();

            expect(yield* drainSwiftCapture(account.id, { amount: literal })).toEqual([]);

            const { entry, transaction } = yield* fetchImported();

            expect(entry.amount).toBe(micro);
            expect(transaction.externalId).toBe(CAPTURE_ID);
            expect(yield* remainingCaptures()).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        ['"  Silpo  "', 'Silpo'],
        ['"Сільпо Київ"', 'Сільпо Київ'],
        ['"Café 🛒 Zürich"', 'Café 🛒 Zürich'],
        ['""', 'Apple Pay purchase'],
        ['"   "', 'Apple Pay purchase']
    ])('merchant %s becomes the trimmed title %s with the fallback for blank merchants', ([literal, title]) =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedAccount();

            yield* drainSwiftCapture(account.id, { merchant: literal });

            expect((yield* fetchImported()).transaction.title).toBe(title);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('decodes a Swift record that omits cardName, currency and duplicateTransactionId keys', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedAccount();

            expect(yield* drainSwiftCapture(account.id, { cardName: null })).toEqual([]);

            expect((yield* fetchImported()).transaction.externalId).toBe(CAPTURE_ID);
            expect(yield* remainingCaptures()).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        ['2026-08-07T10:00:00.123Z', '2026-08-07T10:00:00.000Z'],
        ['2026-08-07T13:00:00+03:00', '2026-08-07T10:00:00.000Z'],
        ['2026-08-07T05:00:00-05:00', '2026-08-07T10:00:00.000Z']
    ])('capturedAt %s maps to the same UTC instant %s', ([capturedAt, instant]) =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedAccount();

            yield* drainSwiftCapture(account.id, { capturedAt: JSON.stringify(capturedAt) });

            expect((yield* fetchImported()).transaction.operatedAt.toISOString()).toBe(instant);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('wallet-capture/payload-contract accounts and idempotency', () => {
    it.effect('reports an unknown accountId as ACCOUNT_UNAVAILABLE without creating or acknowledging it', () =>
        Effect.gen(function* () {
            yield* walletCaptureSeedAccount();

            const reviewItems = yield* drainSwiftCapture(999);

            yield* expectCaptureKeptForReview(reviewItems, WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports an inactive account as ACCOUNT_UNAVAILABLE without creating or acknowledging it', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({ title: 'Archived card', isActive: false });

            const reviewItems = yield* drainSwiftCapture(account.id);

            yield* expectCaptureKeptForReview(reviewItems, WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([['0'], ['-5.5'], ['"NaN"'], ['"19.99"'], ['null']])(
        'rejects the whole payload when amount is %s and creates nothing or acknowledges nothing',
        ([literal]) =>
            Effect.gen(function* () {
                const account = yield* walletCaptureSeedAccount();
                const walletCaptureImportService = yield* WalletCaptureImportService;

                walletCaptureNativeStub.seed(
                    walletCaptureParseSwiftPayload([
                        walletCaptureSwiftJson(CAPTURE_ID, account.id, { amount: literal }),
                        walletCaptureSwiftJson(SECOND_CAPTURE_ID, account.id)
                    ])
                );

                expect(Exit.isFailure(yield* Effect.exit(walletCaptureImportService.drain()))).toBe(true);
                expect(yield* testDb.select().from(TransactionEntityTable)).toEqual([]);
                expect(yield* remainingCaptures()).toHaveLength(2);
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('imports a captureId drained twice only once', () =>
        Effect.gen(function* () {
            const walletCaptureImportService = yield* WalletCaptureImportService;
            const account = yield* walletCaptureSeedAccount();

            yield* drainSwiftCapture(account.id);
            walletCaptureNativeStub.seed(walletCaptureParseSwiftPayload([walletCaptureSwiftJson(CAPTURE_ID, account.id)]));
            yield* walletCaptureImportService.drain();

            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(1);
            expect(yield* testDb.select().from(TransactionEntryEntityTable)).toHaveLength(1);
            expect(yield* remainingCaptures()).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('wallet-capture/payload-contract currency', () => {
    it.effect('keeps the amount and uses exchangeRate 1 when currency is absent', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedAccount();

            yield* drainSwiftCapture(account.id, { amount: '19.99' });

            const { entry, transaction } = yield* fetchImported();

            expect(entry.amount).toBe(FIXED_AMOUNT_MICRO);
            expect(entry.exchangeRate).toBe(1);
            expect(transaction.exchangeRate).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([['"UAH"'], ['" uah "']])(
        'keeps the amount and uses exchangeRate 1 when currency %s equals the account currency',
        ([literal]) =>
            Effect.gen(function* () {
                const account = yield* walletCaptureSeedAccount();

                yield* drainSwiftCapture(account.id, { amount: '19.99', currency: literal });

                const { entry } = yield* fetchImported();

                expect(entry.amount).toBe(FIXED_AMOUNT_MICRO);
                expect(entry.exchangeRate).toBe(1);
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('converts a foreign currency capture into account currency with the historical rate at the capture date', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedAccount();
            const euro = yield* requireInstrument(CurrencyEnum.EUR);

            yield* walletCaptureSeedHistoricalRate(euro.id, account.instrumentId, EURO_RATE, '2026-08-07');
            yield* drainSwiftCapture(account.id, { amount: '10', currency: '"EUR"' });

            const { entry, transaction } = yield* fetchImported();

            expect(entry.amount).toBe(EURO_AMOUNT_MICRO);
            expect(entry.exchangeRate).toBe(EURO_RATE);
            expect(transaction.exchangeRate).toBe(EURO_RATE);
            expect(yield* remainingCaptures()).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports a currency code with no instrument as CURRENCY_UNAVAILABLE without creating or acknowledging it', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedAccount();

            const reviewItems = yield* drainSwiftCapture(account.id, { currency: '"XYZ"' });

            yield* expectCaptureKeptForReview(reviewItems, WalletCaptureReviewReasonEnum.CURRENCY_UNAVAILABLE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('falls back to the current exchange rate when no historical rate exists', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedAccount();
            const custom = yield* seed.instrument({ code: 'ZZZ', name: 'Custom unit', symbol: 'Z' });

            yield* seedExchangeRate(custom.id, account.instrumentId, 2.5);
            yield* drainSwiftCapture(account.id, { amount: '10', currency: '"ZZZ"' });

            const { entry } = yield* fetchImported();

            expect(entry.amount).toBe(CUSTOM_AMOUNT_MICRO);
            expect(entry.exchangeRate).toBe(2.5);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports a known currency without any exchange rate as CURRENCY_UNAVAILABLE', () =>
        Effect.gen(function* () {
            const account = yield* walletCaptureSeedAccount();

            yield* seed.instrument({ code: 'ZZZ', name: 'Custom unit', symbol: 'Z' });

            const reviewItems = yield* drainSwiftCapture(account.id, { currency: '"ZZZ"' });

            yield* expectCaptureKeptForReview(reviewItems, WalletCaptureReviewReasonEnum.CURRENCY_UNAVAILABLE);
        }).pipe(Effect.provide(TestLayer))
    );
});
