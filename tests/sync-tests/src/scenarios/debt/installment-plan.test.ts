import { DebtAccountService } from '@app/account/service/debt-account.service';
import {
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    ExternalSourceEnum,
    InstallmentPlanRepository,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, InstallmentPlanService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { fetchAccountBalance, fetchDebtProgress, seed, seedBankSyncAccount, testDb, TestLayer } from '../../harness';

const toMicroUnits = (amount: number): number => Math.round(amount * PRECISION);

const seedPart = (accountId: number, title: string, amount: number, operatedAt: Date) =>
    seed.manualExpense({ accountId, title, amount: toMicroUnits(amount), operatedAt, externalSource: ExternalSourceEnum.MONOBANK });

const seedMonthlyPayoffParts = Effect.fnUntraced(function* (iban: string, merchant: string) {
    const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, iban);
    const first = yield* seedPart(card.id, `Платіж ${merchant}`, 100, new Date(2026, 1, 28, 23, 9));
    const second = yield* seedPart(card.id, `Платіж ${merchant}`, 100, new Date(2026, 2, 28, 9, 13));

    return { card, first, second };
});

const convert = Effect.fnUntraced(function* (transactionId: number, installmentCount: number, totalAmount: number) {
    const installmentPlanService = yield* InstallmentPlanService;

    return yield* installmentPlanService.convertExpense({
        transactionId,
        installmentCount,
        totalAmount: toMicroUnits(totalAmount),
        title: 'Plan'
    });
});

const runPostSync = Effect.fnUntraced(function* () {
    const transferConsolidationService = yield* TransferConsolidationService;

    yield* transferConsolidationService.consolidate(null);
});

const convertAndSyncPayoffPlan = (transactionId: number) => convert(transactionId, 3, 300).pipe(Effect.tap(runPostSync));

const syncAndExpectPaidOff = Effect.fnUntraced(function* (accountId: number) {
    yield* runPostSync();

    expect((yield* fetchDebtProgress(accountId)).outstandingAmount).toBe(0);
    expect(yield* fetchAccountBalance(accountId)).toBe(0);
});

const fetchAttachedTransactionIds = Effect.fnUntraced(function* (debtAccountId: number) {
    const rows = yield* testDb
        .select({ transactionId: DebtEventEntityTable.transactionId })
        .from(DebtEventEntityTable)
        .where(eq(DebtEventEntityTable.debtAccountId, debtAccountId));

    return rows.map(row => row.transactionId).filter(isDefined);
});

const fetchDebtEventAmounts = Effect.fnUntraced(function* (debtAccountId: number, direction: DebtEventDirectionEnum) {
    const rows = yield* testDb
        .select({ source: DebtEventEntityTable.source, amount: DebtEventEntityTable.amount })
        .from(DebtEventEntityTable)
        .where(and(eq(DebtEventEntityTable.debtAccountId, debtAccountId), eq(DebtEventEntityTable.direction, direction)));

    return rows;
});

const fetchManualDebtEventDates = Effect.fnUntraced(function* (debtAccountId: number) {
    const rows = yield* testDb
        .select({ direction: DebtEventEntityTable.direction, operatedAt: DebtEventEntityTable.operatedAt })
        .from(DebtEventEntityTable)
        .where(and(eq(DebtEventEntityTable.debtAccountId, debtAccountId), eq(DebtEventEntityTable.source, DebtEventSourceEnum.MANUAL)));

    return rows;
});

describe('installment plan', () => {
    it.effect('converts the itbox first part, attaches existing and synced parts and keeps their category', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-itbox');
            const first = yield* seedPart(card.id, 'Платіж itbox.ua', 28_058.33, new Date(2026, 7, 12, 10));
            const second = yield* seedPart(card.id, 'Щомісячний платіж itbox.ua', 28_058.34, new Date(2026, 8, 12, 9));
            const { accountId } = yield* convert(first.id, 3, 84_175);
            const progress = yield* fetchDebtProgress(accountId);
            const parts = yield* testDb
                .select({ type: TransactionEntityTable.type, categoryId: TransactionEntryEntityTable.categoryId })
                .from(TransactionEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .where(inArray(TransactionEntityTable.id, [first.id, second.id]));

            expect(progress.paidAmount).toBe(toMicroUnits(56_116.67));
            expect(progress.outstandingAmount).toBe(toMicroUnits(28_058.33));
            expect(yield* fetchAccountBalance(accountId)).toBe(-toMicroUnits(28_058.33));
            expect(parts).toEqual([
                { type: TransactionTypeEnum.EXPENSE, categoryId: null },
                { type: TransactionTypeEnum.EXPENSE, categoryId: null }
            ]);

            const installmentPlanRepository = yield* InstallmentPlanRepository;
            const schedule = yield* installmentPlanRepository.getSchedule(accountId);

            expect(schedule?.paidCount).toBe(2);
            expect(schedule?.nextDueAt?.getDate()).toBe(12);
            expect(schedule?.nextAmount).toBe(toMicroUnits(28_058.33));

            yield* seedPart(card.id, 'Щомісячний платіж itbox.ua', 28_058.33, new Date(2026, 9, 11, 9));
            yield* syncAndExpectPaidOff(accountId);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('attaches a YABLUKA part under a different legal name and skips an unprefixed same-amount expense', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-yabluka');
            const first = yield* seedPart(card.id, 'Платіж YABLUKA🔥', 13_166, new Date(2025, 7, 12, 10));
            const { accountId } = yield* convert(first.id, 3, 39_498);
            const second = yield* seedPart(card.id, 'Щомісячний платіж ФОП Якименко', 13_166, new Date(2025, 8, 12, 10));
            yield* seedPart(card.id, 'Rozetka', 13_166, new Date(2025, 8, 12, 11));

            yield* runPostSync();

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id, second.id]);
            expect((yield* fetchDebtProgress(accountId)).outstandingAmount).toBe(toMicroUnits(13_166));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('attaches an early payoff after the latest monthly installment', () =>
        Effect.gen(function* () {
            const { card, first, second } = yield* seedMonthlyPayoffParts('UA-early-payoff', 'Tech Shop');
            const payoff = yield* seedPart(card.id, 'Дострокове погашення Tech Shop', 100, new Date(2026, 2, 30, 17, 54));
            const { accountId } = yield* convertAndSyncPayoffPlan(first.id);

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id, second.id, payoff.id]);
            expect((yield* fetchDebtProgress(accountId)).outstandingAmount).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { title: 'attaches an early payoff before the final scheduled installment', payoffAt: new Date(2026, 2, 15, 12), isAttached: true },
        {
            title: 'attaches an early payoff within tolerance after the final scheduled installment',
            payoffAt: new Date(2026, 2, 31, 12),
            isAttached: true
        },
        {
            title: 'does not attach an early payoff after the final scheduled installment window',
            payoffAt: new Date(2026, 3, 1, 12),
            isAttached: false
        }
    ])('$title', ({ payoffAt, isAttached }) =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-early-window');
            const first = yield* seedPart(card.id, 'Платіж Tech Shop', 100, new Date(2026, 0, 28, 10));
            const payoff = yield* seedPart(card.id, 'Дострокове погашення Tech Shop', 200, payoffAt);
            const { accountId } = yield* convertAndSyncPayoffPlan(first.id);
            const installmentPlanService = yield* InstallmentPlanService;

            yield* installmentPlanService.attachDueParts();
            yield* installmentPlanService.attachDueParts();

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual(isAttached ? [first.id, payoff.id] : [first.id]);
            expect((yield* fetchDebtProgress(accountId)).outstandingAmount).toBe(isAttached ? 0 : toMicroUnits(200));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('closes a plan when the early payoff is one cent above the remaining amount', () =>
        Effect.gen(function* () {
            const { card, first, second } = yield* seedMonthlyPayoffParts('UA-early-rounding', 'Device Store');
            const payoff = yield* seedPart(card.id, 'Дострокове погашення Device Store', 100.01, new Date(2026, 2, 30, 17, 54));
            const { accountId } = yield* convertAndSyncPayoffPlan(first.id);

            const progress = yield* fetchDebtProgress(accountId);

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id, second.id, payoff.id]);
            expect(progress.outstandingAmount).toBe(0);
            expect(progress.overpaidAmount).toBe(toMicroUnits(0.01));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        {
            title: 'does not attach an unrelated early payoff with the same remaining amount',
            iban: 'UA-early-unrelated',
            merchant: 'Camera Store',
            payoffMerchants: ['Other Store']
        },
        {
            title: 'does not attach an ambiguous early payoff',
            iban: 'UA-early-ambiguous',
            merchant: 'Phone Store',
            payoffMerchants: ['Phone Store', 'Phone Store']
        }
    ])('$title', ({ iban, merchant, payoffMerchants }) =>
        Effect.gen(function* () {
            const { card, first, second } = yield* seedMonthlyPayoffParts(iban, merchant);

            yield* Effect.forEach(payoffMerchants, (payoffMerchant, index) =>
                seedPart(card.id, `Дострокове погашення ${payoffMerchant}`, 100, new Date(2026, 2, 30, 17, 54 + index))
            );
            const { accountId } = yield* convertAndSyncPayoffPlan(first.id);

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id, second.id]);
            expect((yield* fetchDebtProgress(accountId)).outstandingAmount).toBe(toMicroUnits(100));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not attach an early payoff when the monthly part is ambiguous', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-monthly-ambiguous-payoff');
            const first = yield* seedPart(card.id, 'Платіж Audio Store', 100, new Date(2026, 1, 28, 23, 9));
            yield* seedPart(card.id, 'Щомісячний платіж Audio Store', 100, new Date(2026, 2, 28, 9, 13));
            yield* seedPart(card.id, 'Щомісячний платіж Audio Store', 100, new Date(2026, 2, 28, 9, 14));
            yield* seedPart(card.id, 'Дострокове погашення Audio Store', 200, new Date(2026, 2, 30, 17, 54));
            const { accountId } = yield* convertAndSyncPayoffPlan(first.id);

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id]);
            expect((yield* fetchDebtProgress(accountId)).outstandingAmount).toBe(toMicroUnits(200));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each(
        [
            { title: 'early payoff', candidateTitle: 'Дострокове погашення Tech Shop', amount: 200, operatedAt: new Date(2026, 2, 15, 12) },
            { title: 'monthly part', candidateTitle: 'Щомісячний платіж Tech Shop', amount: 100, operatedAt: new Date(2026, 2, 28, 12) }
        ].flatMap(candidate => [
            { ...candidate, duringConversion: false },
            { ...candidate, duringConversion: true }
        ])
    )(
        'leaves $title unlinked across two eligible plans (duringConversion=$duringConversion)',
        ({ candidateTitle, amount, operatedAt, duringConversion }) =>
            Effect.gen(function* () {
                const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-cross-plan');
                const first = yield* seedPart(card.id, 'Платіж Tech Shop', 100, new Date(2026, 1, 28, 10));
                const firstPlan = yield* convert(first.id, 3, 300);
                const second = yield* seedPart(card.id, 'Платіж Tech Shop', 100, new Date(2026, 1, 28, 11));
                const seedCandidate = seedPart(card.id, candidateTitle, amount, operatedAt);

                if (duringConversion) {
                    yield* seedCandidate;
                }

                const secondPlan = yield* convert(second.id, 3, 300);

                if (!duringConversion) {
                    yield* seedCandidate;
                }

                expect(yield* fetchAttachedTransactionIds(firstPlan.accountId)).toEqual([first.id]);
                expect(yield* fetchAttachedTransactionIds(secondPlan.accountId)).toEqual([second.id]);
                const installmentPlanService = yield* InstallmentPlanService;
                const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([card.id]);
                yield* runPostSync();
                yield* installmentPlanService.attachDueParts();
                yield* installmentPlanService.attachDueParts();

                expect(yield* fetchAttachedTransactionIds(firstPlan.accountId)).toEqual([first.id]);
                expect(yield* fetchAttachedTransactionIds(secondPlan.accountId)).toEqual([second.id]);
                expect((yield* fetchDebtProgress(firstPlan.accountId)).outstandingAmount).toBe(toMicroUnits(200));
                expect((yield* fetchDebtProgress(secondPlan.accountId)).outstandingAmount).toBe(toMicroUnits(200));
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('cancels the COMFY plan when its first part is refunded', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-comfy');
            const { expense } = yield* seed.refundedExpense({
                accountId: card.id,
                title: 'Платіж COMFY',
                expenseAmount: toMicroUnits(8_378.4),
                refundAmounts: [toMicroUnits(8_378.4)],
                expenseOperatedAt: new Date(2026, 7, 4, 12)
            });
            const { accountId } = yield* convert(expense.id, 3, 25_135.2);

            yield* syncAndExpectPaidOff(accountId);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not attach an off-amount part', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-off');
            const first = yield* seedPart(card.id, 'Платіж itbox.ua', 28_058.33, new Date(2026, 7, 12, 10));
            yield* seedPart(card.id, 'Щомісячний платіж itbox.ua', 28_000, new Date(2026, 8, 12, 9));
            const { accountId } = yield* convert(first.id, 3, 84_175);

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('edits the total and payment count of a converted plan without touching its attached parts', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-edit');
            const first = yield* seedPart(card.id, 'Платіж itbox.ua', 28_058.33, new Date(2026, 7, 12, 10));
            const second = yield* seedPart(card.id, 'Щомісячний платіж itbox.ua', 28_058.34, new Date(2026, 8, 12, 9));
            const { accountId } = yield* convert(first.id, 3, 84_175);
            const closeEventsBefore = yield* fetchDebtEventAmounts(accountId, DebtEventDirectionEnum.CLOSE);
            const debtAccountService = yield* DebtAccountService;

            yield* debtAccountService.updateDebtById(accountId, { title: 'Plan', targetBalance: 112_233.32, installmentCount: 4 });

            const installmentPlanRepository = yield* InstallmentPlanRepository;
            const schedule = yield* installmentPlanRepository.getSchedule(accountId);

            expect(yield* fetchDebtEventAmounts(accountId, DebtEventDirectionEnum.CLOSE)).toEqual(closeEventsBefore);
            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id, second.id]);
            expect(yield* fetchDebtEventAmounts(accountId, DebtEventDirectionEnum.OPEN)).toEqual([
                { source: DebtEventSourceEnum.MANUAL, amount: toMicroUnits(112_233.32) }
            ]);
            expect(schedule?.installmentCount).toBe(4);
            expect(schedule?.paidCount).toBe(2);
            expect(schedule?.totalAmount).toBe(toMicroUnits(112_233.32));
            expect(schedule?.remainingAmount).toBe(toMicroUnits(56_116.65));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('converting a later part walks back to the earlier part and anchors the schedule on it', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-backward');
            const first = yield* seedPart(card.id, 'Платіж itbox.ua', 28_058.33, new Date(2026, 7, 12, 10));
            const second = yield* seedPart(card.id, 'Щомісячний платіж itbox.ua', 28_058.34, new Date(2026, 8, 12, 9));
            const { accountId } = yield* convert(second.id, 3, 84_175);
            const installmentPlanRepository = yield* InstallmentPlanRepository;
            const schedule = yield* installmentPlanRepository.getSchedule(accountId);

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id, second.id]);
            expect(schedule?.paidCount).toBe(2);
            expect(schedule?.nextDueAt?.getMonth()).toBe(9);
            expect(schedule?.nextDueAt?.getDate()).toBe(12);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('stops walking back when an earlier month has two matching parts', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-ambiguous');
            yield* seedPart(card.id, 'Платіж itbox.ua', 28_058.33, new Date(2026, 7, 12, 10));
            yield* seedPart(card.id, 'Платіж itbox.ua', 28_058.33, new Date(2026, 7, 13, 10));
            const second = yield* seedPart(card.id, 'Щомісячний платіж itbox.ua', 28_058.34, new Date(2026, 8, 12, 9));
            const { accountId } = yield* convert(second.id, 3, 84_175);

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([second.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('walks back from a month-end part across an earlier time of day', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-month-end');
            const first = yield* seedPart(card.id, 'Платіж itbox.ua', 28_058.33, new Date(2026, 0, 31, 10));
            const second = yield* seedPart(card.id, 'Щомісячний платіж itbox.ua', 28_058.33, new Date(2026, 1, 28, 9));
            const { accountId } = yield* convert(second.id, 3, 84_175);

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id, second.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('walks back from a month-end part to earlier parts paid on different days', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-anchor');
            const first = yield* seedPart(card.id, 'Платіж itbox.ua', 28_058.33, new Date(2026, 0, 31, 10));
            const second = yield* seedPart(card.id, 'Щомісячний платіж itbox.ua', 28_058.33, new Date(2026, 1, 25, 9));
            const third = yield* seedPart(card.id, 'Щомісячний платіж itbox.ua', 28_058.33, new Date(2026, 2, 31, 9));
            const { accountId } = yield* convert(third.id, 3, 84_174.99);
            const installmentPlanRepository = yield* InstallmentPlanRepository;
            const schedule = yield* installmentPlanRepository.getSchedule(accountId);

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id, second.id, third.id]);
            expect(schedule?.paidCount).toBe(3);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('attaches only same-title parts to a manual plan', () =>
        Effect.gen(function* () {
            const cash = yield* seedBankSyncAccount('Cash', null, 'UA-manual');
            const first = yield* seed.manualExpense({
                accountId: cash.id,
                title: 'Laptop',
                amount: toMicroUnits(500),
                operatedAt: new Date(2026, 0, 12, 10)
            });
            const { accountId } = yield* convert(first.id, 3, 1_500);
            const second = yield* seed.manualExpense({
                accountId: cash.id,
                title: '  laptop ',
                amount: toMicroUnits(500),
                operatedAt: new Date(2026, 1, 12, 10)
            });
            yield* seed.manualExpense({
                accountId: cash.id,
                title: 'Groceries',
                amount: toMicroUnits(500),
                operatedAt: new Date(2026, 1, 12, 11)
            });

            yield* runPostSync();

            expect(yield* fetchAttachedTransactionIds(accountId)).toEqual([first.id, second.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the manual event dates when the plan settings are edited', () =>
        Effect.gen(function* () {
            const card = yield* seedBankSyncAccount('Black', ExternalSourceEnum.MONOBANK, 'UA-rename');
            const first = yield* seedPart(card.id, 'Платіж itbox.ua', 28_058.33, new Date(2026, 7, 12, 10));
            const { accountId } = yield* convert(first.id, 3, 84_175);
            const datesBefore = yield* fetchManualDebtEventDates(accountId);
            const debtAccountService = yield* DebtAccountService;

            yield* debtAccountService.updateDebtById(accountId, { title: 'Renamed plan' });
            yield* debtAccountService.updateDebtById(accountId, { targetBalance: 90_000 });

            expect(yield* fetchManualDebtEventDates(accountId)).toEqual(datesBefore);
        }).pipe(Effect.provide(TestLayer))
    );
});
