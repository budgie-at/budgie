import { CategorySourceEnum, ExternalSourceEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import {
    APPLE_PAY_CAPTURE_BASE_OPERATED_AT,
    APPLE_PAY_CAPTURE_MINUTE_MS,
    APPLE_PAY_NOTHING_MERGED,
    APPLE_PAY_PURCHASE_AMOUNT,
    addMilliseconds,
    expectCaptureMerged,
    expectNotMerged,
    fetchPrimaryEntry,
    seedApplePayCapture,
    seedBankExpense
} from './apple-pay-capture-fixture';
import { runConsolidation } from './run-consolidation';
import { testQueryService, testSeedService } from './test-context';

import type { ApplePayBankExpenseInputInterface } from './interface/apple-pay-bank-expense-input.interface';
import type { ApplePayCaptureInputInterface } from './interface/apple-pay-capture-input.interface';

export const seedPurchaseBank = (accountId: number, overrides: Partial<Omit<ApplePayBankExpenseInputInterface, 'accountId'>> = {}) =>
    seedBankExpense({
        accountId,
        amount: APPLE_PAY_PURCHASE_AMOUNT,
        externalId: 'bank-1',
        operatedAt: APPLE_PAY_CAPTURE_BASE_OPERATED_AT,
        source: ExternalSourceEnum.MONOBANK,
        ...overrides
    });

export const seedPurchaseCapture = (accountId: number, overrides: Partial<Omit<ApplePayCaptureInputInterface, 'accountId'>> = {}) =>
    seedApplePayCapture({
        accountId,
        amount: APPLE_PAY_PURCHASE_AMOUNT,
        captureId: 'capture-1',
        operatedAt: addMilliseconds(APPLE_PAY_CAPTURE_BASE_OPERATED_AT, APPLE_PAY_CAPTURE_MINUTE_MS),
        ...overrides
    });

export const seedPurchasePair = Effect.fnUntraced(function* (
    accountId: number,
    bankOverrides: Partial<Omit<ApplePayBankExpenseInputInterface, 'accountId'>> = {},
    captureOverrides: Partial<Omit<ApplePayCaptureInputInterface, 'accountId'>> = {}
) {
    const bank = yield* seedPurchaseBank(accountId, bankOverrides);
    const capture = yield* seedPurchaseCapture(accountId, captureOverrides);

    return { bank, capture };
});

export const consolidateAndExpectMerged = Effect.fnUntraced(function* (bankTransactionId: number, captureTransactionId: number) {
    expect(yield* runConsolidation()).toEqual({ found: 1, consolidated: 1 });

    yield* expectCaptureMerged(bankTransactionId, captureTransactionId);
});

export const consolidateAndExpectNothingMerged = Effect.fnUntraced(function* (transactionIds: readonly number[]) {
    expect(yield* runConsolidation()).toEqual(APPLE_PAY_NOTHING_MERGED);

    yield* expectNotMerged(transactionIds);
});

export const expectBankRowDetails = Effect.fnUntraced(function* (
    bankTransactionId: number,
    expected: {
        readonly categoryId: number | null;
        readonly categorySource: CategorySourceEnum;
        readonly comment: string;
        readonly tagIds: readonly number[];
    }
) {
    expect(yield* fetchPrimaryEntry(bankTransactionId)).toMatchObject({
        categoryId: expected.categoryId,
        categorySource: expected.categorySource
    });
    expect(yield* testQueryService.fetchTransactionTagIds(bankTransactionId)).toEqual(expected.tagIds);
    expect((yield* testQueryService.fetchTransactionById(bankTransactionId)).comment).toBe(expected.comment);
});

export const seedCategorizedCapturePair = Effect.fnUntraced(function* (
    accountId: number,
    bankOverrides: Partial<Omit<ApplePayBankExpenseInputInterface, 'accountId'>> = {}
) {
    const captureCategory = yield* testSeedService.category('Groceries');
    const captureTag = yield* testSeedService.tag('Family');
    const pair = yield* seedPurchasePair(accountId, bankOverrides, {
        categoryId: captureCategory.id,
        comment: 'Weekly shopping',
        tagIds: [captureTag.id]
    });

    return { ...pair, captureCategory, captureTag };
});

export const expectCaptureDetailsCarried = (bankTransactionId: number, categoryId: number, tagId: number) =>
    expectBankRowDetails(bankTransactionId, {
        categoryId,
        categorySource: CategorySourceEnum.MANUAL_EXPENSE_DUPLICATE,
        comment: 'Weekly shopping',
        tagIds: [tagId]
    });
