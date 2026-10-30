import {
    AccountBalanceRepository,
    AccountTypeEnum,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    TransactionDayNetAmountRepository,
    TransactionViewRepository
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { explainQueryPlan, runRefundScenario, seed, TestLayer } from '../../harness';

const DAY = new Date(2026, 2, 10, 12, 0, 0);
const NEXT_DAY = new Date(2026, 2, 11, 12, 0, 0);
const DEFAULT_INSTRUMENT_ID = 1;

const getDayNetAmounts = (accountIds: number[] | null, day: Date = DAY) =>
    Effect.flatMap(TransactionDayNetAmountRepository, transactionDayNetAmountRepository =>
        transactionDayNetAmountRepository.getDayNetAmounts(
            accountIds,
            new Date(day.getFullYear(), day.getMonth(), day.getDate()),
            new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999),
            DEFAULT_INSTRUMENT_ID
        )
    );

describe('transaction/day-net-amounts', () => {
    it.effect('totals the whole day even when the page stops inside it', () =>
        Effect.gen(function* () {
            const transactionViewRepository = yield* TransactionViewRepository;
            const account = yield* seed.account({ type: AccountTypeEnum.CASH });

            yield* Effect.forEach([9, 12, 18], (hour, index) =>
                seed.manualExpense({
                    accountId: account.id,
                    amount: (index + 1) * 10 * PRECISION,
                    operatedAt: new Date(2026, 2, 10, hour, 0, 0)
                })
            );

            const page = yield* transactionViewRepository.getAll(
                2,
                { ...DEFAULT_TRANSACTION_FILTER, accountIds: [account.id] },
                LanguageEnum.EN
            );
            expect(page).toHaveLength(2);

            const [day] = yield* getDayNetAmounts([account.id]);
            expect(day).toMatchObject({ day: '2026-03-10', amount: -60 * PRECISION, instrumentCount: 1 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('nets a consolidated refund and matches the ledger balance', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { account, result } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [40 * PRECISION],
                expenseOperatedAt: DAY,
                refundDelaySeconds: 3600
            });

            expect(result.consolidated).toBe(1);

            const [day] = yield* getDayNetAmounts([account.id]);
            const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances([account.id]);

            expect(day.amount).toBe(-80 * PRECISION);
            expect(day.amount).toBe(ledgerBalances.get(account.id));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('buckets a later refund on its own day', () =>
        Effect.gen(function* () {
            const { account, result } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [40 * PRECISION],
                expenseOperatedAt: DAY
            });
            expect(result.consolidated).toBe(1);

            const [expenseDay] = yield* getDayNetAmounts([account.id]);
            const [refundDay] = yield* getDayNetAmounts([account.id], NEXT_DAY);

            expect(expenseDay.amount).toBe(-120 * PRECISION);
            expect(refundDay).toMatchObject({ day: '2026-03-11', amount: 40 * PRECISION });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('counts a transfer into the filtered account as income and cancels it globally', () =>
        Effect.gen(function* () {
            const source = yield* seed.account({ type: AccountTypeEnum.CASH, title: 'Source' });
            const target = yield* seed.account({ type: AccountTypeEnum.CASH, title: 'Target' });

            yield* seed.directTransfer({
                exchangeRate: 1,
                operatedAt: DAY,
                sourceAccountId: source.id,
                sourceAmount: 50 * PRECISION,
                sourceEntryExchangeRate: 1,
                targetAccountId: target.id,
                targetAmount: 50 * PRECISION,
                toIban: null
            });

            const [targetDay] = yield* getDayNetAmounts([target.id]);
            const [sourceDay] = yield* getDayNetAmounts([source.id]);
            const [globalDay] = yield* getDayNetAmounts(null);

            expect(targetDay.amount).toBe(50 * PRECISION);
            expect(sourceDay.amount).toBe(-50 * PRECISION);
            expect(globalDay.amount).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns no totals for a debt account', () =>
        Effect.gen(function* () {
            const debtAccount = yield* seed.account({ type: AccountTypeEnum.DEBT, title: 'Alice' });

            yield* seed.manualExpense({ accountId: debtAccount.id, amount: 25 * PRECISION, operatedAt: DAY });

            expect(yield* getDayNetAmounts([debtAccount.id])).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reads through date-range and refund indexes without table scans', () =>
        Effect.gen(function* () {
            const repository = yield* TransactionDayNetAmountRepository;
            const explainDayNetAmounts = (accountIds: number[] | null) =>
                explainQueryPlan(getDayNetAmounts(accountIds).pipe(Effect.provideService(TransactionDayNetAmountRepository, repository)));
            const plans = [...(yield* explainDayNetAmounts(null)), ...(yield* explainDayNetAmounts([1]))];

            expect(plans.filter(step => step.startsWith('SCAN'))).toEqual([]);
            expect(plans).toContain('SEARCH transactions USING INDEX transactions_operated_at_idx (operated_at>? AND operated_at<?)');
            expect(plans).toContain(
                'SEARCH transaction_entries USING INDEX transaction_entries_original_transaction_idx (original_transaction_id=?)'
            );
        }).pipe(Effect.provide(TestLayer))
    );
});
