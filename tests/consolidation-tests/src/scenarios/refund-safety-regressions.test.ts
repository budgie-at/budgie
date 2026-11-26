import { RefundConsolidationService, RefundPairRepository } from '@budgie/consolidation';
import {
    ExternalSourceEnum,
    LanguageEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { expectConsolidationParent } from '../harness/consolidation-revert-audit';
import { REJECTED_PAYMENT_FEE_TITLE } from '../harness/rejected-payment-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { seedPrivatbankTransaction } from '../harness/seed-privatbank-transaction';
import { seedTitledTransaction } from '../harness/seed-titled-transaction';
import { rebuildStoredBalances, testDb, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const BASE_OPERATED_AT = new Date(2026, 6, 1, 10, 0, 0);
const POOL_EXPENSE_AMOUNT = convertToMicroUnits(100);
const POOL_FEE_AMOUNT = convertToMicroUnits(20);
const POOL_FIRST_PRINCIPAL_REFUND = convertToMicroUnits(70);
const POOL_SECOND_PRINCIPAL_REFUND = convertToMicroUnits(50);
const OVERSIZED_REFUND_AMOUNT = convertToMicroUnits(500);
const VALID_PARTIAL_REFUND_AMOUNT = convertToMicroUnits(60);
const TWIN_AMOUNT = convertToMicroUnits(100);
const PRIVATBANK_EXPENSE_RATE = 50;
const PRIVATBANK_FALLING_RATE = 48;
const PRIVATBANK_ORIGINAL_AMOUNT = 40;
const PRIVATBANK_EXTRA_REFUND_AMOUNT = convertToMicroUnits(50);
const MULTI_FEE_FIRST_AMOUNT = convertToMicroUnits(2);
const MULTI_FEE_SECOND_AMOUNT = convertToMicroUnits(3);
const MULTI_FEE_EXCESS_AMOUNT = convertToMicroUnits(1);

const shiftedDate = (offsetDays: number): Date => new Date(BASE_OPERATED_AT.getTime() + offsetDays * DAY_MILLISECONDS);

const expectUnpaired = (transactionId: number) =>
    Effect.gen(function* () {
        expect((yield* testQueryService.fetchTransactionById(transactionId)).consolidationParentTransactionId).toBeNull();
    });

layer(TestLayer)('consolidation/refund-safety-regressions', it => {
    it.effect('separates principal and fee refund pools and rejects a duplicate fee refund on a later run', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'refund-pool-card' });
            const { expense, refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: 'PoolMerchant',
                expenseAmount: POOL_EXPENSE_AMOUNT,
                expenseFeeAmount: POOL_FEE_AMOUNT,
                refundAmounts: [POOL_FIRST_PRINCIPAL_REFUND, POOL_SECOND_PRINCIPAL_REFUND],
                expenseOperatedAt: BASE_OPERATED_AT,
                externalIdPrefix: 'pool-separation'
            });
            const [firstPrincipalRefund, secondPrincipalRefund] = refunds;
            const firstFeeRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'pool-fee-refund-1',
                operatedAt: shiftedDate(3),
                amount: POOL_FEE_AMOUNT,
                title: REJECTED_PAYMENT_FEE_TITLE,
                isRefund: true
            });

            yield* runConsolidation();

            yield* expectConsolidationParent(firstPrincipalRefund.id, expense.id);
            yield* expectUnpaired(secondPrincipalRefund.id);
            yield* expectConsolidationParent(firstFeeRefund.id, expense.id);

            const secondFeeRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'pool-fee-refund-2',
                operatedAt: shiftedDate(4),
                amount: POOL_FEE_AMOUNT,
                title: REJECTED_PAYMENT_FEE_TITLE,
                isRefund: true
            });

            yield* rebuildStoredBalances;

            expect((yield* runConsolidation()).consolidated).toBe(0);
            yield* expectUnpaired(secondFeeRefund.id);
            yield* expectUnpaired(secondPrincipalRefund.id);
        })
    );

    it.effect('does not let an oversized non-covering refund block a valid partial refund on the same expense', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'non-covering-card' });
            const { expense, refunds } = yield* testSeedService.refundedExpense({
                accountId: account.id,
                title: 'OversizedMerchant',
                expenseAmount: POOL_EXPENSE_AMOUNT,
                refundAmounts: [OVERSIZED_REFUND_AMOUNT, VALID_PARTIAL_REFUND_AMOUNT],
                expenseOperatedAt: BASE_OPERATED_AT,
                externalIdPrefix: 'non-covering'
            });
            const [oversizedRefund, validPartialRefund] = refunds;

            expect((yield* runConsolidation()).consolidated).toBe(1);
            yield* expectConsolidationParent(validPartialRefund.id, expense.id);
            yield* expectUnpaired(oversizedRefund.id);
        })
    );

    it.effect('matches a 3-of-3 chronological twin bijection without orphaning the earliest charge and latest refund', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'twin-bijection-card' });
            const seedCharge = (externalId: string, dayOffset: number) =>
                seedTitledTransaction({
                    accountId: account.id,
                    externalId,
                    operatedAt: shiftedDate(dayOffset),
                    amount: TWIN_AMOUNT,
                    title: 'TwinCoffee',
                    isRefund: false
                });
            const seedReversal = (externalId: string, dayOffset: number) =>
                seedTitledTransaction({
                    accountId: account.id,
                    externalId,
                    operatedAt: shiftedDate(dayOffset),
                    amount: TWIN_AMOUNT,
                    title: 'TwinCoffee',
                    isRefund: true
                });

            const firstExpense = yield* seedCharge('twin-charge-0', -25);
            const secondExpense = yield* seedCharge('twin-charge-1', 0);
            const thirdExpense = yield* seedCharge('twin-charge-2', 2);
            const firstRefund = yield* seedReversal('twin-refund-0', 1);
            const secondRefund = yield* seedReversal('twin-refund-1', 3);
            const thirdRefund = yield* seedReversal('twin-refund-2', 31);

            expect((yield* runConsolidation()).consolidated).toBe(3);
            yield* expectConsolidationParent(firstRefund.id, firstExpense.id);
            yield* expectConsolidationParent(secondRefund.id, secondExpense.id);
            yield* expectConsolidationParent(thirdRefund.id, thirdExpense.id);
        })
    );

    it.effect('enforces PrivatBank FX closure across review, manual picker, and convertToRefund', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const refundConsolidationService = yield* RefundConsolidationService;
            const account = yield* testSeedService.account({
                externalId: 'pb-fx-closure-card',
                externalSource: ExternalSourceEnum.PRIVATBANK
            });
            const expense = yield* seedPrivatbankTransaction({
                accountId: account.id,
                exchangeRate: PRIVATBANK_EXPENSE_RATE,
                externalId: 'pb-fx-expense',
                isRefund: false,
                operatedAt: shiftedDate(0),
                originalAmount: PRIVATBANK_ORIGINAL_AMOUNT,
                title: 'Netflix'
            });
            const fallingRateReversal = yield* seedPrivatbankTransaction({
                accountId: account.id,
                exchangeRate: PRIVATBANK_FALLING_RATE,
                externalId: 'pb-fx-reversal',
                isRefund: true,
                operatedAt: shiftedDate(2),
                originalAmount: PRIVATBANK_ORIGINAL_AMOUNT,
                title: 'ПОВЕРНЕННЯ КОШТІВ, Netflix'
            });

            expect((yield* runConsolidation()).consolidated).toBe(1);
            yield* expectConsolidationParent(fallingRateReversal.id, expense.id);

            const secondRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'pb-fx-second-refund',
                operatedAt: shiftedDate(4),
                amount: PRIVATBANK_EXTRA_REFUND_AMOUNT,
                title: 'Netflix, partial',
                isRefund: true
            });

            yield* rebuildStoredBalances;

            expect(yield* refundPairRepository.findReviewCandidates()).toEqual([]);
            expect(yield* refundPairRepository.findRefundableExpenseCandidates(secondRefund.id, '', LanguageEnum.EN)).toEqual([]);
            expect(
                yield* Effect.flip(
                    refundConsolidationService.convertToRefund({
                        refundIncomeTransactionId: secondRefund.id,
                        expenseTransactionId: expense.id
                    })
                )
            ).toMatchObject({ _tag: 'RefundExceedsExpenseError' });
        })
    );

    it.effect('rejects cross-currency, split-entry income, and soft-deleted transactions in convertToRefund', () =>
        Effect.gen(function* () {
            const refundConsolidationService = yield* RefundConsolidationService;
            const uahAccount = yield* testSeedService.account({ externalId: 'guard-uah-card' });
            const euroInstrument = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: 'EUR' });
            const euroAccount = yield* testSeedService.account({ externalId: 'guard-eur-card', instrumentId: euroInstrument.id });
            const expense = yield* seedTitledTransaction({
                accountId: uahAccount.id,
                externalId: 'guard-expense',
                operatedAt: shiftedDate(0),
                amount: POOL_EXPENSE_AMOUNT,
                title: 'GuardShop',
                isRefund: false
            });
            const euroIncome = yield* seedTitledTransaction({
                accountId: euroAccount.id,
                externalId: 'guard-eur-income',
                operatedAt: shiftedDate(1),
                amount: VALID_PARTIAL_REFUND_AMOUNT,
                title: 'GuardShop',
                isRefund: true
            });
            const splitIncome = yield* testSeedService.manualExpense({
                accountId: uahAccount.id,
                amount: VALID_PARTIAL_REFUND_AMOUNT,
                operatedAt: shiftedDate(2),
                title: 'GuardShop',
                type: TransactionTypeEnum.INCOME,
                entries: [
                    { amount: convertToMicroUnits(40), categoryId: null },
                    { amount: convertToMicroUnits(20), categoryId: null }
                ]
            });
            const softDeletedIncome = yield* seedTitledTransaction({
                accountId: uahAccount.id,
                externalId: 'guard-deleted-income',
                operatedAt: shiftedDate(3),
                amount: VALID_PARTIAL_REFUND_AMOUNT,
                title: 'GuardShop',
                isRefund: true
            });

            yield* testDb
                .update(TransactionEntityTable)
                .set({ deletedAt: shiftedDate(4) })
                .where(eq(TransactionEntityTable.id, softDeletedIncome.id));

            expect(
                yield* Effect.flip(
                    refundConsolidationService.convertToRefund({
                        refundIncomeTransactionId: euroIncome.id,
                        expenseTransactionId: expense.id
                    })
                )
            ).toMatchObject({ _tag: 'RefundNotFromIncomeError' });

            expect(
                yield* Effect.flip(
                    refundConsolidationService.convertToRefund({
                        refundIncomeTransactionId: splitIncome.id,
                        expenseTransactionId: expense.id
                    })
                )
            ).toMatchObject({ _tag: 'RefundNotFromIncomeError' });

            expect(
                yield* Effect.flip(
                    refundConsolidationService.convertToRefund({
                        refundIncomeTransactionId: softDeletedIncome.id,
                        expenseTransactionId: expense.id
                    })
                )
            ).toMatchObject({ _tag: 'RefundTransactionNotFoundError' });
        })
    );

    it.effect('sums multiple live fee entries when capping fee refunds on an expense', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'multi-fee-refund-card' });
            const expense = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'multi-fee-expense',
                operatedAt: shiftedDate(0),
                amount: POOL_EXPENSE_AMOUNT,
                title: 'MultiFeeMerchant',
                isRefund: false
            });

            yield* testSeedService.feeEntry(expense.id, 'multi-fee-one', {
                accountId: account.id,
                amount: MULTI_FEE_FIRST_AMOUNT
            });
            yield* testSeedService.feeEntry(expense.id, 'multi-fee-two', {
                accountId: account.id,
                amount: MULTI_FEE_SECOND_AMOUNT
            });

            const firstFeeRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'multi-fee-refund-one',
                operatedAt: shiftedDate(1),
                amount: MULTI_FEE_FIRST_AMOUNT,
                title: REJECTED_PAYMENT_FEE_TITLE,
                isRefund: true
            });
            const secondFeeRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'multi-fee-refund-two',
                operatedAt: shiftedDate(2),
                amount: MULTI_FEE_SECOND_AMOUNT,
                title: REJECTED_PAYMENT_FEE_TITLE,
                isRefund: true
            });
            const excessFeeRefund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'multi-fee-refund-excess',
                operatedAt: shiftedDate(3),
                amount: MULTI_FEE_EXCESS_AMOUNT,
                title: REJECTED_PAYMENT_FEE_TITLE,
                isRefund: true
            });

            yield* rebuildStoredBalances;
            yield* runConsolidation();

            yield* expectConsolidationParent(firstFeeRefund.id, expense.id);
            yield* expectConsolidationParent(secondFeeRefund.id, expense.id);
            yield* expectUnpaired(excessFeeRefund.id);
        })
    );

    it.effect('auto-consolidates a compound cancellation-and-payment-return title prefix as REFUND', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account({ externalId: 'compound-prefix-card' });
            const expense = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'compound-prefix-expense',
                operatedAt: shiftedDate(0),
                amount: POOL_EXPENSE_AMOUNT,
                title: 'OTHER SHOP',
                isRefund: false
            });
            const refund = yield* seedTitledTransaction({
                accountId: account.id,
                externalId: 'compound-prefix-refund',
                operatedAt: shiftedDate(1),
                amount: POOL_EXPENSE_AMOUNT,
                title: 'Скасування. Повернення платежу OTHER SHOP',
                isRefund: true
            });

            expect((yield* runConsolidation()).consolidated).toBe(1);
            yield* expectConsolidationParent(refund.id, expense.id);
            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.REFUND
            );
        })
    );

    it.effect('separates principal and fee refund pools in manual convertToRefund in both directions', () =>
        Effect.gen(function* () {
            const refundConsolidationService = yield* RefundConsolidationService;
            const account = yield* testSeedService.account({ externalId: 'manual-pool-split-card' });
            const seedManualPoolCase = (suffix: string, baseDay: number) =>
                Effect.gen(function* () {
                    const { expense, refunds } = yield* testSeedService.refundedExpense({
                        accountId: account.id,
                        title: `ManualPool-${suffix}`,
                        expenseAmount: POOL_EXPENSE_AMOUNT,
                        expenseFeeAmount: POOL_FEE_AMOUNT,
                        refundAmounts: [POOL_EXPENSE_AMOUNT],
                        expenseOperatedAt: shiftedDate(baseDay),
                        externalIdPrefix: `manual-pool-${suffix}`
                    });
                    const [principalRefund] = refunds;
                    const feeRefund = yield* seedTitledTransaction({
                        accountId: account.id,
                        externalId: `manual-pool-fee-refund-${suffix}`,
                        operatedAt: shiftedDate(baseDay + 2),
                        amount: POOL_FEE_AMOUNT,
                        title: REJECTED_PAYMENT_FEE_TITLE,
                        isRefund: true
                    });

                    return { expense, principalRefund, feeRefund };
                });

            const feeFirstCase = yield* seedManualPoolCase('fee-first', 0);
            const principalFirstCase = yield* seedManualPoolCase('principal-first', 5);

            yield* rebuildStoredBalances;

            yield* refundConsolidationService.convertToRefund({
                refundIncomeTransactionId: feeFirstCase.feeRefund.id,
                expenseTransactionId: feeFirstCase.expense.id
            });
            yield* refundConsolidationService.convertToRefund({
                refundIncomeTransactionId: feeFirstCase.principalRefund.id,
                expenseTransactionId: feeFirstCase.expense.id
            });
            yield* expectConsolidationParent(feeFirstCase.feeRefund.id, feeFirstCase.expense.id);
            yield* expectConsolidationParent(feeFirstCase.principalRefund.id, feeFirstCase.expense.id);

            yield* refundConsolidationService.convertToRefund({
                refundIncomeTransactionId: principalFirstCase.principalRefund.id,
                expenseTransactionId: principalFirstCase.expense.id
            });
            yield* refundConsolidationService.convertToRefund({
                refundIncomeTransactionId: principalFirstCase.feeRefund.id,
                expenseTransactionId: principalFirstCase.expense.id
            });
            yield* expectConsolidationParent(principalFirstCase.principalRefund.id, principalFirstCase.expense.id);
            yield* expectConsolidationParent(principalFirstCase.feeRefund.id, principalFirstCase.expense.id);
        })
    );
});
