import { AccountTypeEnum, CategorySourceEnum, ExternalSourceEnum, convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    APPLE_PAY_CAPTURE_BASE_OPERATED_AT as BASE_TIME,
    APPLE_PAY_CAPTURE_DAY_MS as DAY_MS,
    APPLE_PAY_CAPTURE_HOUR_MS as HOUR_MS,
    APPLE_PAY_CAPTURE_MINUTE_MS as MINUTE_MS,
    APPLE_PAY_NOTHING_MERGED,
    APPLE_PAY_PURCHASE_AMOUNT as PURCHASE_AMOUNT,
    addMilliseconds,
    expectCaptureMerged,
    expectNotMerged,
    fetchPrimaryEntry,
    seedApplePayCardAccount,
    seedMccDefaultCategory
} from '../harness/apple-pay-capture-fixture';
import {
    consolidateAndExpectMerged,
    consolidateAndExpectNothingMerged,
    expectBankRowDetails,
    expectCaptureDetailsCarried,
    seedCategorizedCapturePair,
    seedPurchaseBank,
    seedPurchaseCapture,
    seedPurchasePair
} from '../harness/apple-pay-capture-scenario';
import {
    expectSourceStateRestored,
    expectSourcesRestored,
    fetchLedgerBalances,
    snapshotSourceState
} from '../harness/consolidation-revert-audit';
import {
    buildManualExpenseDuplicateAmount,
    seedManualExpenseDuplicateAccounts,
    seedManualExpenseDuplicatePairs
} from '../harness/manual-expense-duplicate-fixture';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, unconsolidateById, TestLayer } from '../harness/test-context';

const BANK_SOURCES = [
    ExternalSourceEnum.MONOBANK,
    ExternalSourceEnum.PRIVATBANK,
    ExternalSourceEnum.ERSTE,
    ExternalSourceEnum.REVOLUT,
    ExternalSourceEnum.WISE,
    ExternalSourceEnum.COINBASE,
    ExternalSourceEnum.BINANCE,
    ExternalSourceEnum.CSV
] as const;

const DATE_ONLY_SOURCES = [ExternalSourceEnum.ERSTE, ExternalSourceEnum.CSV] as const;

const seedCardAccounts = Effect.fnUntraced(function* () {
    return {
        card: yield* seedApplePayCardAccount('Card'),
        otherCard: yield* seedApplePayCardAccount('Other card')
    };
});

layer(TestLayer)('consolidation/apple-pay-capture', it => {
    it.effect.each(BANK_SOURCES)('replaces a capture with the bank row on the same account for %s', source =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { bank, capture } = yield* seedPurchasePair(
                card.id,
                { source },
                { operatedAt: addMilliseconds(BASE_TIME, 5 * MINUTE_MS) }
            );

            yield* consolidateAndExpectMerged(bank.id, capture.id);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('replaces a capture with the bank row on a plain bank account', () =>
        Effect.gen(function* () {
            const card = yield* seedApplePayCardAccount('Plain card', AccountTypeEnum.BANK);
            const { bank, capture } = yield* seedPurchasePair(card.id, { source: ExternalSourceEnum.CSV });

            yield* consolidateAndExpectMerged(bank.id, capture.id);
        })
    );

    it.effect('keeps the bank row amount, date, title and external ids and counts the purchase once on the account', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { bank, capture } = yield* seedPurchasePair(
                card.id,
                {},
                { merchant: 'Apple Pay merchant', operatedAt: addMilliseconds(BASE_TIME, 20 * MINUTE_MS) }
            );
            const bankBefore = yield* testQueryService.fetchTransactionById(bank.id);
            const bankEntryBefore = yield* fetchPrimaryEntry(bank.id);

            expect(yield* fetchLedgerBalances([card.id])).toEqual([[card.id, -2 * convertToMicroUnits(PURCHASE_AMOUNT)]]);

            yield* runConsolidation();

            const bankAfter = yield* testQueryService.fetchTransactionById(bank.id);
            const bankEntryAfter = yield* fetchPrimaryEntry(bank.id);

            yield* expectCaptureMerged(bank.id, capture.id);
            expect(bankAfter).toMatchObject({
                title: bankBefore.title,
                operatedAt: bankBefore.operatedAt,
                externalId: 'bank-1',
                externalSource: ExternalSourceEnum.MONOBANK,
                type: bankBefore.type
            });
            expect(bankEntryAfter).toMatchObject({
                amount: bankEntryBefore.amount,
                externalId: bankEntryBefore.externalId,
                accountId: card.id
            });
            expect(yield* fetchLedgerBalances([card.id])).toEqual([[card.id, -convertToMicroUnits(PURCHASE_AMOUNT)]]);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('compares the capture amount with the bank primary entry plus its fee', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { bank, capture } = yield* seedPurchasePair(
                card.id,
                { amount: PURCHASE_AMOUNT + 1, feeAmount: 1 },
                { amount: PURCHASE_AMOUNT + 1 }
            );

            yield* consolidateAndExpectMerged(bank.id, capture.id);
            expect(yield* fetchLedgerBalances([card.id])).toEqual([[card.id, -convertToMicroUnits(PURCHASE_AMOUNT + 1)]]);
        })
    );

    it.effect('carries the capture category, tags and comment over to an uncategorized bank row', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { bank, capture, captureCategory, captureTag } = yield* seedCategorizedCapturePair(card.id);

            yield* consolidateAndExpectMerged(bank.id, capture.id);
            yield* expectCaptureDetailsCarried(bank.id, captureCategory.id, captureTag.id);
        })
    );

    it.effect('lets the capture category, tags and comment override an MCC default category', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { category: mccDefaultCategory, mccCategoryLookup } = yield* seedMccDefaultCategory('Supermarkets');
            const { bank, capture, captureCategory, captureTag } = yield* seedCategorizedCapturePair(card.id, { mccCategoryLookup });

            expect(yield* fetchPrimaryEntry(bank.id)).toMatchObject({
                categoryId: mccDefaultCategory.id,
                categorySource: CategorySourceEnum.MCC_DEFAULT
            });

            yield* consolidateAndExpectMerged(bank.id, capture.id);
            yield* expectCaptureDetailsCarried(bank.id, captureCategory.id, captureTag.id);
        })
    );

    it.effect.each([CategorySourceEnum.RULE, CategorySourceEnum.USER, CategorySourceEnum.AI])(
        'keeps a bank row category with source %s and copies nothing onto it',
        categorySource =>
            Effect.gen(function* () {
                const { card } = yield* seedCardAccounts();
                const bankCategory = yield* testSeedService.category('Restaurants');
                const { bank, capture } = yield* seedCategorizedCapturePair(card.id);

                yield* testSeedService.entryCategory((yield* fetchPrimaryEntry(bank.id)).id, bankCategory.id, categorySource);
                yield* consolidateAndExpectMerged(bank.id, capture.id);
                yield* expectBankRowDetails(bank.id, { categoryId: bankCategory.id, categorySource, comment: '', tagIds: [] });
            })
    );

    it.effect('keeps a bank row that already has tags and copies nothing onto it', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const bankTag = yield* testSeedService.tag('Card');
            const { bank, capture } = yield* seedCategorizedCapturePair(card.id);

            yield* testSeedService.transactionTag(bank.id, bankTag.id);
            yield* consolidateAndExpectMerged(bank.id, capture.id);
            yield* expectBankRowDetails(bank.id, {
                categoryId: null,
                categorySource: CategorySourceEnum.USER,
                comment: '',
                tagIds: [bankTag.id]
            });
        })
    );

    it.effect('unconsolidation restores both rows, the MCC default category and the account balance', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { category: mccDefaultCategory, mccCategoryLookup } = yield* seedMccDefaultCategory('Supermarkets');
            const { bank, capture } = yield* seedCategorizedCapturePair(card.id, { mccCategoryLookup });
            const stateBeforeConsolidation = yield* snapshotSourceState([bank.id, capture.id]);
            const balancesBeforeConsolidation = yield* fetchLedgerBalances([card.id]);

            expect(yield* runConsolidation()).toEqual({ found: 1, consolidated: 1 });

            yield* unconsolidateById(bank.id);

            yield* expectSourcesRestored([bank.id, capture.id]);
            yield* expectSourceStateRestored(stateBeforeConsolidation);
            yield* expectBankRowDetails(bank.id, {
                categoryId: mccDefaultCategory.id,
                categorySource: CategorySourceEnum.MCC_DEFAULT,
                comment: '',
                tagIds: []
            });
            expect((yield* testQueryService.fetchTransactionById(bank.id)).consolidationType).toBeNull();
            expect(yield* fetchLedgerBalances([card.id])).toEqual(balancesBeforeConsolidation);
        })
    );

    it.effect('merges a capture created after the bank row', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const bank = yield* seedPurchaseBank(card.id);

            expect(yield* runConsolidation()).toEqual(APPLE_PAY_NOTHING_MERGED);

            const capture = yield* seedPurchaseCapture(card.id);

            yield* consolidateAndExpectMerged(bank.id, capture.id);
        })
    );

    it.effect('merges a bank row created after the capture', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const capture = yield* seedPurchaseCapture(card.id, { operatedAt: BASE_TIME });

            expect(yield* runConsolidation()).toEqual(APPLE_PAY_NOTHING_MERGED);

            const bank = yield* seedPurchaseBank(card.id, { operatedAt: addMilliseconds(BASE_TIME, HOUR_MS) });

            yield* consolidateAndExpectMerged(bank.id, capture.id);
        })
    );

    it.effect.each([
        { name: 'foreign capture 2.5% above the bank row', captureAmount: 102.5, isMerged: true },
        { name: 'foreign capture 2.5% below the bank row', captureAmount: 97.5, isMerged: true },
        { name: 'foreign capture 3.5% above the bank row', captureAmount: 103.5, isMerged: false }
    ])('merges only within 3% for a $name', ({ captureAmount, isMerged }) =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { bank, capture } = yield* seedPurchasePair(
                card.id,
                {},
                { amount: captureAmount, exchangeRate: 41.2, operatedAt: addMilliseconds(BASE_TIME, DAY_MS) }
            );

            if (isMerged) {
                yield* consolidateAndExpectMerged(bank.id, capture.id);
            } else {
                yield* consolidateAndExpectNothingMerged([bank.id, capture.id]);
            }
        })
    );

    it.effect('merges a same-currency capture with a foreign-currency bank row within 3%', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { bank, capture } = yield* seedPurchasePair(
                card.id,
                { operationAmount: 2.5 },
                { amount: 102.5, operatedAt: addMilliseconds(BASE_TIME, DAY_MS) }
            );

            yield* consolidateAndExpectMerged(bank.id, capture.id);
        })
    );

    it.effect.each(
        DATE_ONLY_SOURCES.flatMap(source => [
            { source, offsetHours: 15, label: 'the same afternoon' },
            { source, offsetHours: 39, label: 'the next day' }
        ])
    )('merges a $source midnight row with a capture made $label', ({ source, offsetHours }) =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const midnight = new Date(BASE_TIME.getFullYear(), BASE_TIME.getMonth(), BASE_TIME.getDate());
            const { bank, capture } = yield* seedPurchasePair(
                card.id,
                { operatedAt: midnight, source },
                { operatedAt: addMilliseconds(midnight, offsetHours * HOUR_MS) }
            );

            yield* consolidateAndExpectMerged(bank.id, capture.id);
        })
    );

    it.effect('does not merge a capture on a different account', () =>
        Effect.gen(function* () {
            const { card, otherCard } = yield* seedCardAccounts();
            const bank = yield* seedPurchaseBank(card.id);
            const capture = yield* seedPurchaseCapture(otherCard.id);

            yield* consolidateAndExpectNothingMerged([bank.id, capture.id]);
        })
    );

    it.effect.each([
        { name: 'an amount 2% off within 3 hours', captureAmount: 102, offsetMs: 10 * MINUTE_MS },
        { name: 'an amount 0.5% off but 5 hours apart', captureAmount: 100.5, offsetMs: 5 * HOUR_MS },
        { name: 'an exact amount just over 2 days apart', captureAmount: PURCHASE_AMOUNT, offsetMs: 2 * DAY_MS + HOUR_MS },
        { name: 'an exact amount just over 2 days earlier', captureAmount: PURCHASE_AMOUNT, offsetMs: -(2 * DAY_MS + HOUR_MS) }
    ])('does not merge a same-currency capture with $name', ({ captureAmount, offsetMs }) =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { bank, capture } = yield* seedPurchasePair(
                card.id,
                {},
                { amount: captureAmount, operatedAt: addMilliseconds(BASE_TIME, offsetMs) }
            );

            yield* consolidateAndExpectNothingMerged([bank.id, capture.id]);
        })
    );

    it.effect('does not merge a capture with an income bank row', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { bank, capture } = yield* seedPurchasePair(card.id, { isIncome: true });

            yield* consolidateAndExpectNothingMerged([bank.id, capture.id]);
        })
    );

    it.effect('does not treat a MANUAL source row as a bank row', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { bank: manual, capture } = yield* seedPurchasePair(card.id, {
                externalId: 'manual-1',
                source: ExternalSourceEnum.MANUAL
            });

            yield* consolidateAndExpectNothingMerged([manual.id, capture.id]);
        })
    );

    it.effect('does not merge a capture into a bank row that is already a manual expense duplicate', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            const pairs = yield* seedManualExpenseDuplicatePairs(accounts, [0, 1, 2]);
            const [{ synced, manual }] = pairs;

            expect((yield* runConsolidation()).consolidated).toBe(3);

            const capture = yield* seedPurchaseCapture(accounts.syncedAccount.id, {
                amount: convertFromMicroUnits(buildManualExpenseDuplicateAmount(0)),
                operatedAt: addMilliseconds(synced.operatedAt, MINUTE_MS)
            });

            expect(yield* runConsolidation()).toEqual(APPLE_PAY_NOTHING_MERGED);
            expect((yield* testQueryService.fetchTransactionById(capture.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* testQueryService.fetchTransactionById(manual.id)).consolidationParentTransactionId).toBe(synced.id);
        })
    );

    it.effect('does not merge a capture into a bank row that a transfer already consolidated', () =>
        Effect.gen(function* () {
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { fromAccount, expense } = yield* testSeedService.amountTransferPair(
                convertToMicroUnits(PURCHASE_AMOUNT),
                transferMcc.id,
                BASE_TIME
            );

            expect((yield* runConsolidation()).consolidated).toBe(1);

            const capture = yield* seedPurchaseCapture(fromAccount.id);

            expect(yield* runConsolidation()).toEqual(APPLE_PAY_NOTHING_MERGED);
            expect((yield* testQueryService.fetchTransactionById(capture.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationParentTransactionId).not.toBeNull();
        })
    );

    it.effect('never merges a split capture', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const { bank, capture } = yield* seedPurchasePair(card.id, { amount: 70 }, { amount: 70, entryAmounts: [70, 30] });

            yield* consolidateAndExpectNothingMerged([bank.id, capture.id]);
        })
    );

    it.effect.each([
        {
            name: 'a capture linked to a debt',
            linkedTransactionId: (pair: { bank: { id: number }; capture: { id: number } }) => pair.capture.id
        },
        {
            name: 'a capture into a bank row linked to a debt',
            linkedTransactionId: (pair: { bank: { id: number }; capture: { id: number } }) => pair.bank.id
        }
    ])('never merges $name', ({ linkedTransactionId }) =>
        Effect.gen(function* () {
            const { card, otherCard } = yield* seedCardAccounts();
            const pair = yield* seedPurchasePair(card.id);

            yield* testSeedService.debtEvent(linkedTransactionId(pair), otherCard.id, convertToMicroUnits(PURCHASE_AMOUNT));
            yield* consolidateAndExpectNothingMerged([pair.bank.id, pair.capture.id]);
        })
    );

    it.effect('merges only the nearest of two captures into one bank row', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const bank = yield* seedPurchaseBank(card.id);
            const farCapture = yield* seedPurchaseCapture(card.id, {
                captureId: 'capture-far',
                operatedAt: addMilliseconds(BASE_TIME, 30 * MINUTE_MS)
            });
            const nearCapture = yield* seedPurchaseCapture(card.id, {
                captureId: 'capture-near',
                operatedAt: addMilliseconds(BASE_TIME, 10 * MINUTE_MS)
            });

            yield* consolidateAndExpectMerged(bank.id, nearCapture.id);
            yield* expectNotMerged([farCapture.id]);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('lets only the nearest of two bank rows absorb one capture', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const farBank = yield* seedPurchaseBank(card.id, {
                externalId: 'bank-far',
                operatedAt: addMilliseconds(BASE_TIME, -20 * MINUTE_MS)
            });
            const nearBank = yield* seedPurchaseBank(card.id, {
                externalId: 'bank-near',
                operatedAt: addMilliseconds(BASE_TIME, 5 * MINUTE_MS)
            });
            const capture = yield* seedPurchaseCapture(card.id, { operatedAt: BASE_TIME });

            yield* consolidateAndExpectMerged(nearBank.id, capture.id);
            yield* expectNotMerged([farBank.id]);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('pairs two captures with two bank rows one to one', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const first = yield* seedPurchasePair(card.id, {}, { operatedAt: addMilliseconds(BASE_TIME, 5 * MINUTE_MS) });
            const second = yield* seedPurchasePair(
                card.id,
                { externalId: 'bank-2', operatedAt: addMilliseconds(BASE_TIME, HOUR_MS) },
                { captureId: 'capture-2', operatedAt: addMilliseconds(BASE_TIME, HOUR_MS + 5 * MINUTE_MS) }
            );

            expect((yield* runConsolidation()).consolidated).toBe(2);

            yield* expectCaptureMerged(first.bank.id, first.capture.id);
            yield* expectCaptureMerged(second.bank.id, second.capture.id);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('prefers an exact amount over a closer approximate one', () =>
        Effect.gen(function* () {
            const { card } = yield* seedCardAccounts();
            const approximateBank = yield* seedPurchaseBank(card.id, {
                amount: 100.5,
                externalId: 'bank-approximate',
                operatedAt: addMilliseconds(BASE_TIME, MINUTE_MS)
            });
            const exactBank = yield* seedPurchaseBank(card.id, {
                externalId: 'bank-exact',
                operatedAt: addMilliseconds(BASE_TIME, 2 * HOUR_MS)
            });
            const capture = yield* seedPurchaseCapture(card.id, { operatedAt: BASE_TIME });

            yield* consolidateAndExpectMerged(exactBank.id, capture.id);
            yield* expectNotMerged([approximateBank.id]);
        })
    );
});
