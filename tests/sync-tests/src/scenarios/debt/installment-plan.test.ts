import {
    DebtEventEntityTable,
    ExternalSourceEnum,
    InstallmentPlanRepository,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { InstallmentPlanService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { fetchAccountBalance, fetchDebtProgress, seed, seedBankSyncAccount, testDb, TestLayer } from '../../harness';

const toMicroUnits = (amount: number): number => Math.round(amount * PRECISION);

const seedPart = (accountId: number, title: string, amount: number, operatedAt: Date) =>
    seed.manualExpense({ accountId, title, amount: toMicroUnits(amount), operatedAt, externalSource: ExternalSourceEnum.MONOBANK });

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
});
