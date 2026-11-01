import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import { convertToMicroUnits, Db, TransactionReceiptRepository, TransactionRepository, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { seed, TestLayer } from './ledger-test-layer';

const OPERATED_AT = new Date(2026, 9, 27, 9, 0, 0);
const AMOUNT = convertToMicroUnits(10);
const VAT_ID = 'ATU22547304';

interface SeedInput {
    readonly categoryId: number;
    readonly title?: string;
    readonly vatId?: string;
    readonly type?: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
}

const scenario = Effect.gen(function* () {
    const testSeedService = yield* seed;
    const account = yield* testSeedService.account({ title: 'Main' });
    const toys = yield* testSeedService.category('Toys');
    const groceries = yield* testSeedService.category('Groceries');
    const salary = yield* testSeedService.category('Salary');
    const receiptRepository = yield* TransactionReceiptRepository;
    let receiptCount = 0;

    const addTransaction = Effect.fnUntraced(function* ({ categoryId, title = '', vatId, type }: SeedInput) {
        const transaction = yield* testSeedService.manualExpense({
            accountId: account.id,
            amount: AMOUNT,
            operatedAt: OPERATED_AT,
            title,
            categoryId,
            type
        });

        if (isDefined(vatId)) {
            receiptCount += 1;
            yield* receiptRepository.insert({
                transactionId: transaction.id,
                fingerprint: `fingerprint-${receiptCount}`,
                receiptNumber: null,
                merchantVatId: vatId,
                merchantLegalName: null
            });
        }

        return transaction;
    });

    return { addTransaction, toys, groceries, salary, receiptRepository };
});

describe('TransactionReceiptRepository.findMerchantCategoryId', () => {
    it.effect('returns null when nothing matches', () =>
        Effect.gen(function* () {
            const { addTransaction, toys, receiptRepository } = yield* scenario;
            yield* addTransaction({ categoryId: toys.id, title: 'Other shop', vatId: 'ATU00000000' });

            expect(yield* receiptRepository.findMerchantCategoryId(VAT_ID, 'smyths')).toBeNull();
            expect(yield* receiptRepository.findMerchantCategoryId(null, '')).toBeNull();
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('prefers the VAT match over a title match', () =>
        Effect.gen(function* () {
            const { addTransaction, toys, groceries, receiptRepository } = yield* scenario;
            yield* addTransaction({ categoryId: toys.id, vatId: VAT_ID });
            yield* addTransaction({ categoryId: groceries.id, title: 'Smyths' });
            yield* addTransaction({ categoryId: groceries.id, title: 'Smyths' });

            expect(yield* receiptRepository.findMerchantCategoryId(VAT_ID, 'smyths')).toBe(toys.id);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('matches the title ignoring case and whitespace', () =>
        Effect.gen(function* () {
            const { addTransaction, toys, receiptRepository } = yield* scenario;
            yield* addTransaction({ categoryId: toys.id, title: '  SMYTHS Toys ' });

            expect(yield* receiptRepository.findMerchantCategoryId(null, 'smyths toys')).toBe(toys.id);
            expect(yield* receiptRepository.findMerchantCategoryId(VAT_ID, 'smyths toys')).toBe(toys.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('picks the most frequent category', () =>
        Effect.gen(function* () {
            const { addTransaction, toys, groceries, receiptRepository } = yield* scenario;
            yield* addTransaction({ categoryId: toys.id, vatId: VAT_ID });
            yield* addTransaction({ categoryId: groceries.id, vatId: VAT_ID });
            yield* addTransaction({ categoryId: groceries.id, vatId: VAT_ID });

            expect(yield* receiptRepository.findMerchantCategoryId(VAT_ID, '')).toBe(groceries.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores deleted transactions and non-expense transactions', () =>
        Effect.gen(function* () {
            const { addTransaction, toys, groceries, salary, receiptRepository } = yield* scenario;
            const deleted = yield* addTransaction({ categoryId: groceries.id, vatId: VAT_ID });
            yield* addTransaction({ categoryId: groceries.id, title: 'Smyths' });
            yield* addTransaction({ categoryId: salary.id, title: 'Smyths', type: TransactionTypeEnum.INCOME });
            yield* addTransaction({ categoryId: salary.id, vatId: VAT_ID, type: TransactionTypeEnum.INCOME });
            yield* addTransaction({ categoryId: toys.id, title: 'Smyths' });
            yield* addTransaction({ categoryId: toys.id, title: 'Smyths' });
            yield* (yield* TransactionRepository).archiveByIds([deleted.id]);

            expect(yield* receiptRepository.findMerchantCategoryId(VAT_ID, '')).toBeNull();
            expect(yield* receiptRepository.findMerchantCategoryId(null, 'smyths')).toBe(toys.id);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );
});
